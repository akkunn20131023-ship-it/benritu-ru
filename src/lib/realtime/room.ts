import { Emitter } from "./emitter";
import { getClientId, getDisplayName } from "./identity";
import { buildInviteUrl } from "./codes";
import { WebSocketTransport, getRealtimeUrl, type Transport } from "./transport";
import { PROTOCOL_VERSION, type ConnectionStatus, type Peer, type RoomEvents, type ServerMessage } from "./types";

export interface RoomOptions {
  /** 招待URL生成に使う機能ID (例: "realtime-chat") */
  featureId: string;
  /** 参加するルームコード */
  code: string;
  /** 表示名 (未指定なら保存済みの名前 or "ゲスト") */
  name?: string;
  /** テスト等でトランスポートを差し替える場合に指定 */
  transport?: Transport;
}

/**
 * オンライン機能の共通ルーム。あらゆる機能(チャット/共同メモ/ゲーム等)はこの Room を通じて
 * メッセージ送受信・在室者管理を行う。切断復帰・再接続・ホスト移譲・同期ずれ・重複送信に対応。
 */
export class RealtimeRoom {
  readonly clientId = getClientId();
  readonly featureId: string;
  readonly code: string;

  private emitter = new Emitter<RoomEvents>();
  private transport: Transport | null;
  private name: string;

  private _status: ConnectionStatus = "disconnected";
  private _peers: Peer[] = [];
  private _hostId = "";
  private hadBaseline = false;
  private lastSeq = 0;

  private msgCounter = 0;
  /** 未確認(サーバーからのエコー未受信)の送信メッセージ。再接続時に再送する */
  private outbox: { id: string; ch: string; data: unknown }[] = [];
  /** 受信済みメッセージID (重複適用の防止)。FIFO で上限管理 */
  private seen = new Set<string>();
  private seenOrder: string[] = [];

  on = ((event, cb) => this.emitter.on(event, cb)) as Emitter<RoomEvents>["on"];

  constructor(opts: RoomOptions) {
    this.featureId = opts.featureId;
    this.code = opts.code;
    this.name = opts.name || getDisplayName() || "ゲスト";
    const url = getRealtimeUrl();
    this.transport = opts.transport ?? (url ? new WebSocketTransport(url) : null);
  }

  get status(): ConnectionStatus {
    return this.transport ? this._status : "unconfigured";
  }
  get peers(): Peer[] {
    return this._peers;
  }
  get hostId(): string {
    return this._hostId;
  }
  get selfId(): string {
    return this.clientId;
  }
  get isHost(): boolean {
    return this._hostId === this.clientId;
  }
  get inviteUrl(): string {
    return buildInviteUrl(this.featureId, this.code);
  }

  connect(): void {
    if (!this.transport) {
      this.setStatus("unconfigured");
      return;
    }
    this.transport.on("connecting", () => this.setStatus("connecting"));
    this.transport.on("open", () => this.onOpen());
    this.transport.on("close", () => {
      if (this._status !== "unconfigured") this.setStatus("disconnected");
    });
    this.transport.on("message", (m) => this.onMessage(m));
    this.transport.connect();
  }

  private onOpen(): void {
    // (再)接続のたびに join し直す = 切断復帰。未確認メッセージも再送する。
    this.transport!.send({ t: "join", v: PROTOCOL_VERSION, room: this.code, client: { id: this.clientId, name: this.name } });
    for (const m of this.outbox) this.transport!.send({ t: "msg", id: m.id, ch: m.ch, data: m.data });
  }

  private onMessage(m: ServerMessage): void {
    switch (m.t) {
      case "joined": {
        this._peers = m.peers;
        this._hostId = m.host;
        // 再接続で不在中に進んだ分は「同期ずれ」として扱い、再同期を促す
        if (this.hadBaseline && m.seq !== this.lastSeq) {
          this.emitter.emit("desync", { expected: this.lastSeq + 1, received: m.seq });
        }
        this.lastSeq = m.seq;
        this.hadBaseline = true;
        this.setStatus("connected");
        this.emitter.emit("peers", this._peers);
        this.emitter.emit("host", this._hostId);
        break;
      }
      case "peer_join":
        if (!this._peers.some((p) => p.id === m.peer.id)) {
          this._peers = [...this._peers, m.peer];
          this.emitter.emit("peers", this._peers);
        }
        break;
      case "peer_leave":
        this._peers = this._peers.filter((p) => p.id !== m.id);
        this.emitter.emit("peers", this._peers);
        if (m.host !== this._hostId) {
          this._hostId = m.host;
          this.emitter.emit("host", this._hostId);
        }
        break;
      case "host":
        this._hostId = m.id;
        this.emitter.emit("host", this._hostId);
        break;
      case "msg": {
        if (this.seen.has(m.id)) return; // 重複受信を破棄
        this.markSeen(m.id);
        // 自分の送信がエコーされたら未確認リストから外す
        if (m.from === this.clientId) this.outbox = this.outbox.filter((o) => o.id !== m.id);
        // seq 欠番 = 同期ずれ
        const expected = this.lastSeq + 1;
        if (m.seq > expected && this.hadBaseline) this.emitter.emit("desync", { expected, received: m.seq });
        if (m.seq > this.lastSeq) this.lastSeq = m.seq;
        this.emitter.emit("message", { from: m.from, ch: m.ch, data: m.data, seq: m.seq, id: m.id });
        break;
      }
      case "error":
        this.emitter.emit("error", { code: m.code, message: m.message });
        break;
      case "pong":
        break;
    }
  }

  private markSeen(id: string): void {
    this.seen.add(id);
    this.seenOrder.push(id);
    if (this.seenOrder.length > 3000) {
      const old = this.seenOrder.shift();
      if (old) this.seen.delete(old);
    }
  }

  /** アプリメッセージを送信。未接続時はキューに積み、再接続時に自動再送する。 */
  send(ch: string, data: unknown): void {
    const id = `${this.clientId}:${++this.msgCounter}`;
    this.outbox.push({ id, ch, data });
    if (this.outbox.length > 500) this.outbox.shift(); // 上限 (長時間切断時のメモリ保護)
    this.transport?.send({ t: "msg", id, ch, data });
  }

  private setStatus(s: ConnectionStatus): void {
    if (this._status === s) return;
    this._status = s;
    this.emitter.emit("status", this.status);
  }

  /** ルームを離れて接続を閉じる */
  leave(): void {
    this.transport?.send({ t: "leave" });
    this.transport?.close();
    this.emitter.clear();
    this.setStatus("disconnected");
  }
}
