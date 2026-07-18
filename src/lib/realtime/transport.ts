import { Emitter } from "./emitter";
import type { ClientMessage, ServerMessage } from "./types";

/**
 * トランスポート抽象。ブラウザ標準の WebSocket を用いた実装を標準提供するが、
 * 将来 WebRTC 等の「同等の技術」に差し替えられるよう最小のインターフェースに保つ。
 */
export interface Transport {
  on: Emitter<TransportEvents>["on"];
  /** 送信 (未接続なら false)。再送・キューイングは上位(Room)の責務 */
  send(msg: ClientMessage): boolean;
  connect(): void;
  /** 意図的な切断。以後は自動再接続しない */
  close(): void;
  isOpen(): boolean;
}

interface TransportEvents {
  open: void;
  close: void;
  connecting: void;
  message: ServerMessage;
}

/** リアルタイムサーバー URL (wss://...)。未設定なら null (= オンライン機能は無効表示) */
export function getRealtimeUrl(): string | null {
  const url = import.meta.env.VITE_REALTIME_URL as string | undefined;
  return url && url.trim() ? url.trim() : null;
}

/** 自動再接続つき WebSocket トランスポート (指数バックオフ + ジッター) */
export class WebSocketTransport implements Transport {
  private emitter = new Emitter<TransportEvents>();
  private ws: WebSocket | null = null;
  private closedByUser = false;
  private retry = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private url: string) {}

  on = ((event, cb) => this.emitter.on(event, cb)) as Emitter<TransportEvents>["on"];

  connect(): void {
    this.closedByUser = false;
    this.open();
  }

  private open(): void {
    this.emitter.emit("connecting", undefined);
    let ws: WebSocket;
    try {
      ws = new WebSocket(this.url);
    } catch {
      this.scheduleReconnect();
      return;
    }
    this.ws = ws;

    ws.onopen = () => {
      this.retry = 0;
      this.emitter.emit("open", undefined);
      // アプリ層のハートビート (プロキシのアイドル切断対策)
      this.pingTimer = setInterval(() => this.send({ t: "ping" }), 25000);
    };
    ws.onmessage = (ev) => {
      try {
        this.emitter.emit("message", JSON.parse(ev.data) as ServerMessage);
      } catch {
        // 壊れたフレームは無視
      }
    };
    ws.onclose = () => {
      this.cleanupSocket();
      this.emitter.emit("close", undefined);
      if (!this.closedByUser) this.scheduleReconnect();
    };
    ws.onerror = () => {
      // onclose が続けて呼ばれるので、ここでは明示的に閉じるだけ
      ws.close();
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    const base = Math.min(15000, 500 * 2 ** this.retry);
    const delay = base / 2 + Math.random() * (base / 2); // ジッター
    this.retry++;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.closedByUser) this.open();
    }, delay);
  }

  private cleanupSocket(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    this.ws = null;
  }

  send(msg: ClientMessage): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
      return true;
    }
    return false;
  }

  isOpen(): boolean {
    return !!this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  close(): void {
    this.closedByUser = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.cleanupSocket();
    this.ws?.close();
  }
}
