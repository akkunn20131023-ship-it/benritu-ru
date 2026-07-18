/*
 * Mytnela Flow Service Worker
 *
 * 目的: オフラインでもアプリを開けるようにしつつ、新しいデプロイで「古い殻(index.html)と
 *       存在しない新アセット」が噛み合って壊れる事故を避ける (自己修復する更新戦略)。
 *
 * 戦略:
 *   - ページ遷移(navigate): 常に network-first。取得した最新の index をオフライン用に保存し、
 *     オフライン時のみ保存済みシェルへフォールバックする → 常に最新の index が使われる。
 *   - /assets/* (Vite の内容ハッシュ付き = 不変): cache-first で高速化 (名前が変わるので陳腐化しない)。
 *   - その他 (manifest / icon 等): network-first、失敗時のみキャッシュ。
 *   - activate 時に旧バージョンのキャッシュを全削除。デプロイ更新時は下の VERSION を上げる。
 */
const VERSION = "v3";
const CACHE = `mytnela-flow-${VERSION}`;
const OFFLINE_URL = "/index.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE);
        await cache.add(new Request(OFFLINE_URL, { cache: "reload" }));
      } catch {
        // 取得失敗してもオンラインなら network-first で動くため致命的ではない
      }
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 外部リクエストは素通し

  // ページ遷移: 常に最新を取りに行く。オフライン時のみ保存済みアプリシェルへ。
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req);
          const cache = await caches.open(CACHE);
          cache.put(OFFLINE_URL, res.clone());
          return res;
        } catch {
          return (await caches.match(OFFLINE_URL)) || Response.error();
        }
      })()
    );
    return;
  }

  // 内容ハッシュ付き静的アセットは不変なので cache-first
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        const res = await fetch(req);
        if (res.ok) (await caches.open(CACHE)).put(req, res.clone());
        return res;
      })()
    );
    return;
  }

  // その他は network-first
  event.respondWith(
    (async () => {
      try {
        const res = await fetch(req);
        if (res.ok) (await caches.open(CACHE)).put(req, res.clone());
        return res;
      } catch {
        return (await caches.match(req)) || Response.error();
      }
    })()
  );
});
