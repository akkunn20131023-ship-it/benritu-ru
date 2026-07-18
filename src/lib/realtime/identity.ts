import { randomId } from "@/lib/randomId";

/**
 * 匿名の安定した識別子。アカウント登録なしでも「同じ人が再接続した」と分かるように、
 * この端末のブラウザに clientId を保存して使い回す (再接続・ホスト移譲の判定に必要)。
 * 個人を特定する情報は一切含まない。
 */

const ID_KEY = "omni:realtime:clientId";
const NAME_KEY = "omni:realtime:name";

export function getClientId(): string {
  let id = localStorage.getItem(ID_KEY);
  if (!id) {
    id = randomId();
    try {
      localStorage.setItem(ID_KEY, id);
    } catch {
      // localStorage 不可の環境ではセッション限りの ID になる
    }
  }
  return id;
}

export function getDisplayName(): string {
  return localStorage.getItem(NAME_KEY) || "";
}

export function setDisplayName(name: string): void {
  try {
    localStorage.setItem(NAME_KEY, name.slice(0, 40));
  } catch {
    // 保存できなくても致命的ではない
  }
}
