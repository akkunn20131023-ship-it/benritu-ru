/**
 * 実行時に canonical / og:url / twitter:url を「実際に配信されているオリジン」に合わせる。
 *
 * index.html には開発用URLを埋め込まず、公開ドメイン (独自ドメインへ移行しても) に自動追従させるための処理。
 * これにより example.com / example.app などへドメインを変えても再ビルド不要で正しい正規URLを提示できる。
 * CSP で inline script を禁止しているため、この処理はバンドル済みJS (=self) から実行する。
 */
export function applyCanonicalUrls(): void {
  if (typeof document === "undefined" || !location.protocol.startsWith("http")) return;

  const canonicalUrl = location.origin + location.pathname;

  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }
  link.href = canonicalUrl;

  const setMeta = (selector: string, value: string) => {
    const el = document.querySelector<HTMLMetaElement>(selector);
    if (el) el.content = value;
  };
  setMeta('meta[property="og:url"]', canonicalUrl);
  setMeta('meta[name="twitter:url"]', canonicalUrl);
  setMeta('meta[property="og:image"]', location.origin + "/og.svg");
  setMeta('meta[name="twitter:image"]', location.origin + "/og.svg");
}
