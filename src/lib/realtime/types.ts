/**
 * リアルタイム共通基盤の型定義 (クライアント側)。
 * プロトコルは version:1。将来サーバー実装を差し替えても互換を保つため、
 * メッセージ形状はこの定義を唯一の契約とする (realtime-server/index.mjs と対応)。
 */

export const PROTOCOL_VERSION = 1;

/** 接続状態。unconfigured = リアルタイムサーバー URL が未設定のデプロイ (オフライン機能のみ) */
export type ConnectionStatus = "unconfigured" | "disconnected" | "connecting" | "connected" | "error";

export interface Peer {
  id: string;
  name: string;
}

/** アプリ層メッセージ。ch(チャンネル) で用途を分ける (chat / state / cursor など) */
export interface RoomMessage<T = unknown> {
  /** 送信者クライアントID */
  from: string;
  /** チャンネル名 */
  ch: string;
  /** 任意のペイロード */
  data: T;
  /** サーバーが採番した権威シーケンス (順序保証・欠番検知に使う) */
  seq: number;
  /** 送信者採番のメッセージID (重複検知に使う) */
  id: string;
}

/** サーバー → クライアント */
export type ServerMessage =
  | { t: "joined"; v: number; room: string; self: Peer; host: string; peers: Peer[]; seq: number }
  | { t: "peer_join"; peer: Peer }
  | { t: "peer_leave"; id: string; host: string }
  | { t: "host"; id: string }
  | { t: "msg"; seq: number; id: string; from: string; ch: string; data: unknown }
  | { t: "pong" }
  | { t: "error"; code: string; message: string };

/** クライアント → サーバー */
export type ClientMessage =
  | { t: "join"; v: number; room: string; client: Peer; token?: string }
  | { t: "leave" }
  | { t: "msg"; id: string; ch: string; data: unknown }
  | { t: "ping" };

export interface RoomEvents {
  status: ConnectionStatus;
  peers: Peer[];
  host: string;
  /** アプリメッセージ (チャンネル別に `message:<ch>` も発火) */
  message: RoomMessage;
  /** サーバー seq に欠番を検出 = 同期ずれ。スナップショット再同期のトリガ */
  desync: { expected: number; received: number };
  error: { code: string; message: string };
}
