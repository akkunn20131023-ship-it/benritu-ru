import QRCode from "qrcode";

/**
 * ルームコード・招待URL・QRコードのユーティリティ。
 * 参加方法はこの3つのみ (登録・ログイン・メール不要)。
 */

// 紛らわしい文字 (0/O, 1/I など) を除いた大文字英数字
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** 6文字のルームコードを生成 (crypto で偏りなく) */
export function generateRoomCode(length = 6): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

/** 入力されたコードを正規化 (大文字化・空白除去)。不正なら null */
export function normalizeRoomCode(input: string): string | null {
  const code = input.trim().toUpperCase().replace(/\s+/g, "");
  return /^[A-Z0-9]{4,12}$/.test(code) ? code : null;
}

/**
 * 招待URLを組み立てる。ハッシュルーターのため `#/plugin/<featureId>?room=CODE` の形にし、
 * 開いた側が getRoomFromUrl() で自動参加できるようにする。オリジンは実行時の実ドメインを使う
 * (開発用URLを固定しない)。
 */
export function buildInviteUrl(featureId: string, code: string): string {
  const origin = typeof location !== "undefined" ? location.origin : "";
  return `${origin}/#/plugin/${featureId}?room=${encodeURIComponent(code)}`;
}

/** 現在のURL(ハッシュ内クエリ)からルームコードを取り出す */
export function getRoomFromUrl(): string | null {
  if (typeof location === "undefined") return null;
  const hash = location.hash || "";
  const qIndex = hash.indexOf("?");
  if (qIndex === -1) return null;
  const params = new URLSearchParams(hash.slice(qIndex + 1));
  const code = params.get("room");
  return code ? normalizeRoomCode(code) : null;
}

/** 招待URL等の文字列を QR コードの data URL(PNG) に変換 */
export function toQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, { margin: 1, width: 240, errorCorrectionLevel: "M" });
}
