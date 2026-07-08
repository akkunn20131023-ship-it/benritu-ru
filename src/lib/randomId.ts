/** renderer 側で完結する軽量な ID 生成 (プラグインのローカルデータ用) */
export function randomId(): string {
  return crypto.randomUUID();
}
