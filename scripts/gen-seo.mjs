/**
 * ビルド前に robots.txt / sitemap.xml を「実際に公開するドメイン」で生成する。
 *
 * ドメインは環境変数 VITE_SITE_URL で指定 (Vercel/Netlify/Cloudflare のダッシュボードで設定)。
 * 未設定なら既定の仮ドメインを使う。これにより独自ドメインへ移行しても、Vercel の env を
 * 変えて再デプロイするだけで検索エンジン向けの正規URLが自動で揃う。
 *
 * index.html 側の canonical / OG URL は Vite の %VITE_SITE_URL% 置換で同じ値が埋め込まれる。
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const SITE_URL = (process.env.VITE_SITE_URL || "https://mytnelaflow.app").replace(/\/+$/, "");
const publicDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const today = new Date().toISOString().slice(0, 10);

const robots = `# Mytnela Flow — 検索エンジン向け設定 (build 時に自動生成)
User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<!-- build 時に VITE_SITE_URL から自動生成 -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;

writeFileSync(join(publicDir, "robots.txt"), robots);
writeFileSync(join(publicDir, "sitemap.xml"), sitemap);
console.log(`[gen-seo] SITE_URL=${SITE_URL} → public/robots.txt, public/sitemap.xml`);
