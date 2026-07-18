/**
 * Mytnela Flow リアルタイム共通基盤 リレーサーバー
 * ------------------------------------------------------------------
 * アカウント/ログイン/メール不要。参加はルームコードのみ。あらゆるオンライン機能
 * (ゲーム・共同メモ・共同ToDo・ホワイトボード・チャット) が同じこの基盤で動く。
 *
 * 責務:
 *   - ルーム管理 (コードで入退室) と在室者(presence)の配信
 *   - メッセージの中継。ルームごとに単調増加する権威 seq を付与し「同期ずれ」を検知可能にする
 *   - 重複送信の抑制 (送信者+メッセージIDで直近を記憶)
 *   - ホスト選出と、ホスト離脱時の自動ホスト移譲
 *   - 切断検知 (heartbeat) / 再接続は同一 clientId の再 join で復帰
 *   - 荒らし対策の土台: 接続ごとのトークンバケット式レート制限・ルーム最大人数
 *   - メンテナンスモード / 構造化ログ / 監視用 HTTP (/health, /metrics)
 *
 * プロトコルは version:1 (将来のサーバー版と互換を保つため p.v で判定)。
 * 環境変数: PORT, HOST, MAX_ROOM_SIZE, RATE_CAPACITY, RATE_REFILL_PER_SEC,
 *           MAINTENANCE(=1で有効), ADMIN_TOKEN(/metrics 保護), ALLOW_ORIGIN
 */
import http from "node:http";
import { WebSocketServer } from "ws";

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || "0.0.0.0";
const MAX_ROOM_SIZE = Number(process.env.MAX_ROOM_SIZE || 16);
const RATE_CAPACITY = Number(process.env.RATE_CAPACITY || 20);
const RATE_REFILL_PER_SEC = Number(process.env.RATE_REFILL_PER_SEC || 10);
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";
const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || "*";
const HEARTBEAT_MS = 30000;
const PROTOCOL_VERSION = 1;
const ROOM_CODE_RE = /^[A-Z0-9]{4,12}$/;

const isMaintenance = () => process.env.MAINTENANCE === "1";

/** @typedef {{ ws: import('ws').WebSocket, name: string, joinedAt: number }} Member */
/** @typedef {{ code: string, seq: number, hostId: string, members: Map<string, Member>, recentIds: Set<string>, createdAt: number }} Room */

/** @type {Map<string, Room>} */
const rooms = new Map();

const metrics = {
  startedAt: Date.now(),
  totalConnections: 0,
  totalJoins: 0,
  roomsCreated: 0,
  messagesRelayed: 0,
  rateLimited: 0,
};

function log(level, event, extra = {}) {
  process.stdout.write(JSON.stringify({ ts: new Date().toISOString(), level, event, ...extra }) + "\n");
}

function send(ws, obj) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj));
}

function broadcast(room, obj, exceptId) {
  const payload = JSON.stringify(obj);
  for (const [id, m] of room.members) {
    if (id !== exceptId && m.ws.readyState === m.ws.OPEN) m.ws.send(payload);
  }
}

function roster(room) {
  return [...room.members.entries()].map(([id, m]) => ({ id, name: m.name }));
}

/** ホスト離脱時: 最も古くから在室する人を新ホストにする */
function electHost(room) {
  let best = null;
  for (const [id, m] of room.members) {
    if (!best || m.joinedAt < best.joinedAt) best = { id, joinedAt: m.joinedAt };
  }
  return best ? best.id : null;
}

function handleJoin(ctx, p) {
  const code = String(p.room || "").toUpperCase();
  const clientId = String(p.client?.id || "");
  const name = String(p.client?.name || "ゲスト").slice(0, 40);

  if (!ROOM_CODE_RE.test(code) || !clientId) {
    send(ctx.ws, { t: "error", code: "bad_request", message: "ルームコードまたは識別子が不正です" });
    return;
  }
  if (isMaintenance()) {
    send(ctx.ws, { t: "error", code: "maintenance", message: "現在メンテナンス中です。しばらくしてからお試しください。" });
    return;
  }

  let room = rooms.get(code);
  if (!room) {
    room = { code, seq: 0, hostId: clientId, members: new Map(), recentIds: new Set(), createdAt: Date.now() };
    rooms.set(code, room);
    metrics.roomsCreated++;
    log("info", "room_created", { room: code });
  }
  // 同一 clientId の再 join は「再接続」として席を置き換える (重複入室にしない)
  const rejoining = room.members.has(clientId);
  if (!rejoining && room.members.size >= MAX_ROOM_SIZE) {
    send(ctx.ws, { t: "error", code: "room_full", message: `このルームは満員です (上限 ${MAX_ROOM_SIZE} 人)` });
    return;
  }

  const prev = room.members.get(clientId);
  room.members.set(clientId, { ws: ctx.ws, name, joinedAt: prev?.joinedAt ?? Date.now() });
  ctx.clientId = clientId;
  ctx.room = code;
  metrics.totalJoins++;

  send(ctx.ws, { t: "joined", v: PROTOCOL_VERSION, room: code, self: { id: clientId }, host: room.hostId, peers: roster(room), seq: room.seq });
  if (!rejoining) broadcast(room, { t: "peer_join", peer: { id: clientId, name } }, clientId);
  log("info", rejoining ? "rejoin" : "join", { room: code, client: clientId, size: room.members.size });
}

function handleMsg(ctx, p) {
  const room = ctx.room && rooms.get(ctx.room);
  if (!room || !ctx.clientId || !room.members.has(ctx.clientId)) return;

  // レート制限 (トークンバケット)
  const now = Date.now();
  const elapsed = (now - ctx.bucketTs) / 1000;
  ctx.tokens = Math.min(RATE_CAPACITY, ctx.tokens + elapsed * RATE_REFILL_PER_SEC);
  ctx.bucketTs = now;
  if (ctx.tokens < 1) {
    metrics.rateLimited++;
    send(ctx.ws, { t: "error", code: "rate_limited", message: "送信が速すぎます。少し待ってください。" });
    return;
  }
  ctx.tokens -= 1;

  const id = String(p.id || "");
  if (!id) return;
  // 重複送信の抑制 (再接続時の再送などを弾く)
  const dedupKey = ctx.clientId + ":" + id;
  if (room.recentIds.has(dedupKey)) return;
  room.recentIds.add(dedupKey);
  if (room.recentIds.size > 2000) room.recentIds.delete(room.recentIds.values().next().value);

  const seq = ++room.seq;
  metrics.messagesRelayed++;
  broadcast(room, { t: "msg", seq, id, from: ctx.clientId, ch: String(p.ch || ""), data: p.data });
}

function removeMember(ctx, reason) {
  const room = ctx.room && rooms.get(ctx.room);
  if (!room || !ctx.clientId) return;
  const member = room.members.get(ctx.clientId);
  // 別接続で置き換え済み(再接続)なら古い接続の離脱は無視する
  if (!member || member.ws !== ctx.ws) return;

  room.members.delete(ctx.clientId);
  log("info", "leave", { room: room.code, client: ctx.clientId, reason });

  if (room.members.size === 0) {
    rooms.delete(room.code);
    log("info", "room_closed", { room: room.code });
    return;
  }
  let newHost;
  if (room.hostId === ctx.clientId) {
    room.hostId = electHost(room);
    newHost = room.hostId;
    log("info", "host_migrated", { room: room.code, host: newHost });
  }
  broadcast(room, { t: "peer_leave", id: ctx.clientId, host: room.hostId });
  if (newHost) broadcast(room, { t: "host", id: newHost });
}

// ---- HTTP (ヘルスチェック / メトリクス) ----
const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", ALLOW_ORIGIN);
  const url = new URL(req.url, "http://localhost");
  if (url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, maintenance: isMaintenance() }));
    return;
  }
  if (url.pathname === "/metrics") {
    if (ADMIN_TOKEN && url.searchParams.get("token") !== ADMIN_TOKEN) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "unauthorized" }));
      return;
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        ...metrics,
        uptimeSec: Math.floor((Date.now() - metrics.startedAt) / 1000),
        activeRooms: rooms.size,
        activeConnections: [...rooms.values()].reduce((n, r) => n + r.members.size, 0),
        maintenance: isMaintenance(),
      })
    );
    return;
  }
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "not_found" }));
});

const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  metrics.totalConnections++;
  /** 接続ごとの状態 */
  const ctx = { ws, clientId: "", room: "", alive: true, tokens: RATE_CAPACITY, bucketTs: Date.now() };

  ws.on("pong", () => (ctx.alive = true));
  ws.on("message", (raw) => {
    let p;
    try {
      p = JSON.parse(raw.toString());
    } catch {
      send(ws, { t: "error", code: "bad_json", message: "不正なメッセージ形式です" });
      return;
    }
    switch (p?.t) {
      case "join":
        handleJoin(ctx, p);
        break;
      case "msg":
        handleMsg(ctx, p);
        break;
      case "ping":
        send(ws, { t: "pong" });
        break;
      case "leave":
        removeMember(ctx, "left");
        ctx.room = "";
        break;
      default:
        send(ws, { t: "error", code: "unknown_type", message: "未知のメッセージ種別です" });
    }
  });
  ws.on("close", () => removeMember(ctx, "closed"));
  ws.on("error", () => removeMember(ctx, "error"));

  // heartbeat: 一定間隔で ping し、pong が返らない接続は切断して席を解放する
  const hb = setInterval(() => {
    if (ws.readyState !== ws.OPEN) return clearInterval(hb);
    if (!ctx.alive) {
      ws.terminate();
      return clearInterval(hb);
    }
    ctx.alive = false;
    ws.ping();
  }, HEARTBEAT_MS);
  ws.on("close", () => clearInterval(hb));
});

server.listen(PORT, HOST, () => {
  log("info", "server_started", { port: PORT, host: HOST, maxRoom: MAX_ROOM_SIZE, maintenance: isMaintenance() });
});

process.on("SIGINT", () => {
  log("info", "server_stopping");
  server.close(() => process.exit(0));
});
