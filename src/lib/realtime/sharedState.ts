import { Emitter } from "./emitter";
import type { RealtimeRoom } from "./room";

/**
 * 共有状態 (Last-Writer-Wins マップ)。共同メモ・共同ToDo・ホワイトボードなど、
 * 「みんなで同じ状態を編集する」機能の土台。キー単位で最新の書き込みが勝つ。
 *
 * - 各書き込みは (timestamp, clientId) を持ち、衝突時はこの順で新しい方を採用 (収束する)。
 * - 参加直後と同期ずれ検知時に、ホストへスナップショットを要求して全体を取り込む。
 */

interface Cell<T> {
  value: T;
  ts: number;
  by: string;
}
type Op<T> = { k: "op"; key: string; value: T; ts: number; by: string };
type Req = { k: "req" };
type Snap<T> = { k: "snap"; entries: [string, Cell<T>][] };
type Payload<T> = Op<T> | Req | Snap<T>;

export class SharedState<T = unknown> {
  private state = new Map<string, Cell<T>>();
  private emitter = new Emitter<{ change: void }>();
  private requested = false;

  constructor(
    private room: RealtimeRoom,
    private ch = "__state"
  ) {}

  /** 購読を開始。room.connect() の前後どちらで呼んでも良い。 */
  start(): this {
    this.room.on("message", (m) => {
      if (m.ch !== this.ch) return;
      this.handle(m.from, m.data as Payload<T>);
    });
    this.room.on("desync", () => this.requestSnapshot());
    this.room.on("status", (s) => {
      if (s === "connected" && !this.room.isHost) this.requestSnapshot();
    });
    return this;
  }

  on(event: "change", cb: () => void): () => void {
    return this.emitter.on(event, cb);
  }

  get(key: string): T | undefined {
    return this.state.get(key)?.value;
  }
  keys(): string[] {
    return [...this.state.keys()];
  }
  values(): T[] {
    return [...this.state.values()].map((c) => c.value);
  }
  entries(): [string, T][] {
    return [...this.state.entries()].map(([k, c]) => [k, c.value]);
  }
  toObject(): Record<string, T> {
    return Object.fromEntries(this.entries());
  }

  /** 値を書き込み、全員へ配信する */
  set(key: string, value: T): void {
    const cell: Cell<T> = { value, ts: Date.now(), by: this.room.clientId };
    this.state.set(key, cell);
    this.emitter.emit("change", undefined);
    const op: Op<T> = { k: "op", key, value, ts: cell.ts, by: cell.by };
    this.room.send(this.ch, op);
  }

  private requestSnapshot(): void {
    if (this.requested) return;
    this.requested = true;
    const req: Req = { k: "req" };
    this.room.send(this.ch, req);
    // 次の同期ずれでも再度要求できるよう少し後に解除
    setTimeout(() => (this.requested = false), 3000);
  }

  private handle(from: string, p: Payload<T>): void {
    if (!p || typeof p !== "object") return;
    if (p.k === "op") {
      if (this.mergeCell(p.key, { value: p.value, ts: p.ts, by: p.by })) this.emitter.emit("change", undefined);
    } else if (p.k === "req") {
      // ホストだけが全体スナップショットで応答する (応答の重複を避ける)
      if (this.room.isHost && from !== this.room.clientId) {
        const snap: Snap<T> = { k: "snap", entries: [...this.state.entries()] };
        this.room.send(this.ch, snap);
      }
    } else if (p.k === "snap") {
      let changed = false;
      for (const [key, cell] of p.entries) if (this.mergeCell(key, cell)) changed = true;
      if (changed) this.emitter.emit("change", undefined);
    }
  }

  /** LWW マージ。より新しい (ts→clientId 順) 書き込みだけ採用する */
  private mergeCell(key: string, incoming: Cell<T>): boolean {
    const cur = this.state.get(key);
    if (cur && (cur.ts > incoming.ts || (cur.ts === incoming.ts && cur.by >= incoming.by))) return false;
    this.state.set(key, incoming);
    return true;
  }
}
