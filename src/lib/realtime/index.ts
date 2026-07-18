/**
 * リアルタイム共通基盤 SDK の公開エントリ。
 * オンライン機能プラグインは基本的にここからだけ import すればよい。
 *
 *   import { useRoom, generateRoomCode, toQrDataUrl } from "@/lib/realtime";
 */
export { useRoom, useSharedState } from "./useRoom";
export type { UseRoomOptions, UseRoomResult } from "./useRoom";
export { RealtimeRoom } from "./room";
export type { RoomOptions } from "./room";
export { SharedState } from "./sharedState";
export { generateRoomCode, normalizeRoomCode, buildInviteUrl, getRoomFromUrl, toQrDataUrl } from "./codes";
export { getClientId, getDisplayName, setDisplayName } from "./identity";
export { getRealtimeUrl } from "./transport";
export type { ConnectionStatus, Peer, RoomMessage } from "./types";
