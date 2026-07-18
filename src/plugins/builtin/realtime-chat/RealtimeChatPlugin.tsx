import { useEffect, useMemo, useRef, useState } from "react";
import { MessagesSquare, Users, Copy, QrCode, LogOut, Send, Crown, Plus, LogIn, Wifi, WifiOff, Loader2, ServerOff } from "lucide-react";
import type { PluginModule } from "../../types";
import {
  useRoom,
  generateRoomCode,
  normalizeRoomCode,
  getRoomFromUrl,
  toQrDataUrl,
  getDisplayName,
  setDisplayName,
  getRealtimeUrl,
  type ConnectionStatus,
} from "@/lib/realtime";

const FEATURE_ID = "realtime-chat";
const CHAT_CH = "chat";

interface ChatLine {
  id: string;
  from: string;
  name: string;
  text: string;
}

function RealtimeChatPage() {
  const configured = !!getRealtimeUrl();
  const [name, setName] = useState(getDisplayName() || "ゲスト");
  const [code, setCode] = useState<string | null>(null);
  const [joinInput, setJoinInput] = useState("");
  const [lines, setLines] = useState<ChatLine[]>([]);
  const [draft, setDraft] = useState("");
  const [qr, setQr] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { room, status, peers, hostId, selfId, isHost, inviteUrl, error, send } = useRoom({
    featureId: FEATURE_ID,
    code,
    name,
    enabled: !!code,
  });

  // 招待URL経由で開かれた場合は自動参加
  useEffect(() => {
    const urlRoom = getRoomFromUrl();
    if (urlRoom) setCode(urlRoom);
  }, []);

  // チャットメッセージを購読 (自分の送信もサーバーからのエコーで1度だけ届く)
  useEffect(() => {
    if (!room) {
      setLines([]);
      return;
    }
    const off = room.on("message", (m) => {
      if (m.ch !== CHAT_CH) return;
      const d = m.data as { text?: string; name?: string };
      if (!d?.text) return;
      setLines((prev) => [...prev, { id: m.id, from: m.from, name: d.name || "誰か", text: d.text! }]);
    });
    return off;
  }, [room]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [lines]);

  const peerName = useMemo(() => new Map(peers.map((p) => [p.id, p.name])), [peers]);

  function createRoom() {
    setDisplayName(name);
    setLines([]);
    setCode(generateRoomCode());
  }
  function joinRoom() {
    const c = normalizeRoomCode(joinInput);
    if (!c) return;
    setDisplayName(name);
    setLines([]);
    setCode(c);
  }
  function leave() {
    setCode(null);
    setQr(null);
    setLines([]);
  }
  function sendChat() {
    const text = draft.trim();
    if (!text) return;
    send(CHAT_CH, { text, name });
    setDraft("");
  }
  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // クリップボード不可の環境では無視
    }
  }
  async function toggleQr() {
    if (qr) return setQr(null);
    setQr(await toQrDataUrl(inviteUrl));
  }

  if (!configured) {
    return (
      <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center gap-3 text-center">
        <ServerOff size={32} className="text-neutral-400" />
        <p className="text-sm font-medium">オンライン機能は現在オフです</p>
        <p className="max-w-sm text-xs text-neutral-500">
          このデプロイにはリアルタイムサーバーの URL (環境変数 <code className="rounded bg-black/10 px-1 dark:bg-white/10">VITE_REALTIME_URL</code>) が設定されていません。設定すると、登録不要のルームで招待URLやQRから共同作業できます。
        </p>
      </div>
    );
  }

  // ロビー (未参加)
  if (!code) {
    return (
      <div className="mx-auto flex h-full max-w-md flex-col justify-center gap-5">
        <div className="text-center">
          <MessagesSquare size={32} className="mx-auto text-accent" />
          <h2 className="mt-2 text-lg font-semibold">リアルタイムチャット</h2>
          <p className="text-sm text-neutral-500">登録不要。ルームを作って、コードやURL・QRで招待できます。</p>
        </div>

        <label className="text-sm">
          <span className="mb-1 block text-neutral-500">表示名</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} className="app-no-drag w-full rounded-lg glass-panel px-4 py-2.5 text-sm outline-none" />
        </label>

        <button onClick={createRoom} className="app-no-drag flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 text-sm font-medium text-white hover:bg-accent-hover">
          <Plus size={16} /> 新しいルームを作る
        </button>

        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <div className="h-px flex-1 bg-black/10 dark:bg-white/10" /> または <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
        </div>

        <div className="flex gap-2">
          <input
            value={joinInput}
            onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && joinRoom()}
            placeholder="ルームコード (例: K7P3QX)"
            className="app-no-drag flex-1 rounded-lg glass-panel px-4 py-2.5 text-sm uppercase tracking-widest outline-none"
          />
          <button onClick={joinRoom} disabled={!normalizeRoomCode(joinInput)} className="app-no-drag flex items-center gap-1.5 rounded-lg bg-black/5 px-4 py-2.5 text-sm font-medium hover:bg-black/10 disabled:opacity-40 dark:bg-white/10 dark:hover:bg-white/15">
            <LogIn size={16} /> 参加
          </button>
        </div>
      </div>
    );
  }

  // ルーム内
  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col gap-3">
      {/* ヘッダー */}
      <div className="glass-panel flex flex-wrap items-center gap-3 rounded-xl2 p-3">
        <StatusBadge status={status} />
        <button onClick={() => copy(code)} title="コードをコピー" className="app-no-drag flex items-center gap-1.5 rounded-lg bg-black/5 px-3 py-1.5 text-sm font-semibold tracking-widest hover:bg-black/10 dark:bg-white/10">
          {code} <Copy size={13} className="text-neutral-400" />
        </button>
        <button onClick={() => copy(inviteUrl)} className="app-no-drag flex items-center gap-1.5 rounded-lg bg-black/5 px-3 py-1.5 text-xs hover:bg-black/10 dark:bg-white/10">
          <Copy size={13} /> 招待URL
        </button>
        <button onClick={toggleQr} className="app-no-drag flex items-center gap-1.5 rounded-lg bg-black/5 px-3 py-1.5 text-xs hover:bg-black/10 dark:bg-white/10">
          <QrCode size={13} /> QR
        </button>
        <span className="ml-auto flex items-center gap-1 text-xs text-neutral-500">
          <Users size={13} /> {peers.length}
        </span>
        <button onClick={leave} className="app-no-drag flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-red-500 hover:bg-red-500/10">
          <LogOut size={13} /> 退出
        </button>
      </div>

      {qr && (
        <div className="glass-panel flex flex-col items-center gap-2 rounded-xl2 p-4">
          <img src={qr} alt="招待QRコード" className="rounded-lg" width={200} height={200} />
          <p className="text-xs text-neutral-500">このQRを読み取ると同じルームに参加できます</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-500">
          {error.message}
        </div>
      )}

      <div className="flex min-h-0 flex-1 gap-3">
        {/* メッセージ */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div ref={listRef} className="glass-panel flex-1 space-y-2 overflow-y-auto rounded-xl2 p-3">
            {lines.length === 0 ? (
              <p className="pt-8 text-center text-sm text-neutral-500">まだメッセージはありません。最初のひとことを送ってみましょう。</p>
            ) : (
              lines.map((l, i) => {
                const mine = l.from === selfId;
                return (
                  <div key={l.id + i} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                    {!mine && <span className="px-1 text-[11px] text-neutral-400">{peerName.get(l.from) || l.name}</span>}
                    <span className={`max-w-[80%] rounded-2xl px-3 py-1.5 text-sm ${mine ? "bg-accent text-white" : "bg-black/5 dark:bg-white/10"}`}>{l.text}</span>
                  </div>
                );
              })
            )}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendChat()}
              placeholder={status === "connected" ? "メッセージを入力..." : "接続中..."}
              disabled={status !== "connected"}
              className="app-no-drag flex-1 rounded-lg glass-panel px-4 py-2.5 text-sm outline-none disabled:opacity-50"
            />
            <button onClick={sendChat} disabled={status !== "connected" || !draft.trim()} className="app-no-drag flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-40">
              <Send size={16} />
            </button>
          </div>
        </div>

        {/* 在室者 */}
        <div className="hidden w-40 shrink-0 sm:block">
          <div className="glass-panel h-full space-y-1 overflow-y-auto rounded-xl2 p-2">
            <p className="px-2 py-1 text-xs font-medium text-neutral-500">在室者</p>
            {peers.map((p) => (
              <div key={p.id} className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm">
                {p.id === hostId && <Crown size={12} className="shrink-0 text-amber-500" />}
                <span className="truncate">{p.name}</span>
                {p.id === selfId && <span className="ml-auto text-[10px] text-neutral-400">あなた</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
      {isHost && <p className="text-center text-[11px] text-neutral-400">あなたがこのルームのホストです</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: ConnectionStatus }) {
  const map: Record<ConnectionStatus, { icon: React.ReactNode; label: string; cls: string }> = {
    connected: { icon: <Wifi size={13} />, label: "接続中", cls: "bg-emerald-500/15 text-emerald-500" },
    connecting: { icon: <Loader2 size={13} className="animate-spin" />, label: "接続しています", cls: "bg-amber-500/15 text-amber-500" },
    disconnected: { icon: <WifiOff size={13} />, label: "切断", cls: "bg-neutral-500/15 text-neutral-500" },
    error: { icon: <WifiOff size={13} />, label: "エラー", cls: "bg-red-500/15 text-red-500" },
    unconfigured: { icon: <ServerOff size={13} />, label: "オフ", cls: "bg-neutral-500/15 text-neutral-500" },
  };
  const s = map[status];
  return <span className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ${s.cls}`}>{s.icon} {s.label}</span>;
}

export const RealtimeChatPlugin: PluginModule = {
  manifest: {
    id: "realtime-chat",
    name: "リアルタイムチャット",
    version: "0.1.0",
    description: "登録不要・ルームコード/招待URL/QRで参加できるリアルタイムチャット",
    category: "internet",
    entry: "realtime-chat",
  },
  icon: MessagesSquare,
  Component: RealtimeChatPage,
};
