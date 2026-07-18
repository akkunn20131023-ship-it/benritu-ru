import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { RealtimeRoom } from "./room";
import { SharedState } from "./sharedState";
import { getClientId } from "./identity";
import { buildInviteUrl } from "./codes";
import type { ConnectionStatus, Peer } from "./types";

export interface UseRoomOptions {
  featureId: string;
  code: string | null;
  name?: string;
  /** false の間は接続しない (コード未入力時など) */
  enabled?: boolean;
}

export interface UseRoomResult {
  room: RealtimeRoom | null;
  status: ConnectionStatus;
  peers: Peer[];
  hostId: string;
  isHost: boolean;
  selfId: string;
  inviteUrl: string;
  error: { code: string; message: string } | null;
  send: (ch: string, data: unknown) => void;
}

/**
 * プラグインからオンライン機能を使うためのフック。
 * コードを渡すと接続し、在室者・接続状態・ホストを購読できる。
 */
export function useRoom({ featureId, code, name, enabled = true }: UseRoomOptions): UseRoomResult {
  const [room, setRoom] = useState<RealtimeRoom | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [peers, setPeers] = useState<Peer[]>([]);
  const [hostId, setHostId] = useState("");
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const selfId = getClientId();

  useEffect(() => {
    if (!enabled || !code) {
      setRoom(null);
      setStatus("disconnected");
      setPeers([]);
      setHostId("");
      return;
    }
    const r = new RealtimeRoom({ featureId, code, name });
    setRoom(r);
    setStatus(r.status);
    setError(null);
    const offs = [
      r.on("status", setStatus),
      r.on("peers", setPeers),
      r.on("host", setHostId),
      r.on("error", setError),
    ];
    r.connect();
    return () => {
      offs.forEach((off) => off());
      r.leave();
    };
  }, [featureId, code, name, enabled]);

  const send = useCallback((ch: string, data: unknown) => room?.send(ch, data), [room]);
  const inviteUrl = code ? buildInviteUrl(featureId, code) : "";

  return { room, status, peers, hostId, isHost: !!hostId && hostId === selfId, selfId, inviteUrl, error, send };
}

/**
 * 共有状態(LWWマップ)を React で使うためのフック。共同メモ/ToDo等向け。
 * room が接続されると自動でスナップショットを取り込み、変更時に再描画する。
 */
export function useSharedState<T = unknown>(room: RealtimeRoom | null, channel = "__state") {
  const [, force] = useReducer((x: number) => x + 1, 0);
  const ref = useRef<SharedState<T> | null>(null);

  useEffect(() => {
    if (!room) {
      ref.current = null;
      return;
    }
    const ss = new SharedState<T>(room, channel).start();
    ref.current = ss;
    force();
    const off = ss.on("change", force);
    return () => {
      off();
      ref.current = null;
    };
  }, [room, channel]);

  return ref.current;
}
