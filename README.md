# OmniSuite

AI搭載オールインワン生活・学習・クリエイターアプリ。Electron + React + TypeScript 製。

## 技術スタック

Electron / React / TypeScript / Vite / Tailwind CSS / Zustand / React Router / sql.js (SQLite/WASM)

## セットアップ

```bash
npm install
npm run dev       # 開発サーバー起動 (Vite + Electron)
npm run typecheck # 型チェック
npm run build     # 本番ビルド (electron-builder)
```

## フォルダ構成

```
electron/              # Electron main process (Node.js 環境)
  main.ts              # エントリポイント、シングルインスタンス化、ライフサイクル管理
  window.ts             # BrowserWindow 生成 (フレームレス, Windows 11 風)
  preload.ts            # contextBridge 経由で renderer に window.api を公開
  settings.ts            # electron-store によるアプリ設定永続化
  db/
    database.ts          # sql.js (SQLite/WASM) 接続・マイグレーション・保存
    repositories.ts        # todos / notes / recent_items / usage_stats の CRUD
  plugins/
    builtin-manifests.ts   # ビルトインプラグインのマニフェスト一覧
    PluginManager.ts        # プラグイン有効/無効状態の永続化
  ipc/
    registerIpcHandlers.ts  # 全 IPC ハンドラの一括登録

shared/
  types.ts                # main/preload/renderer で共有する型 & IPC チャンネル定数

src/                    # Renderer process (React)
  main.tsx / App.tsx / router.tsx
  components/layout/      # TitleBar, Sidebar, CommandPalette, AppLayout
  stores/                  # Zustand: テーマ・レイアウト・お気に入り
  pages/
    Home/                  # ホーム画面 + ウィジェット群
    PluginPage.tsx          # プラグイン画面ルーター (利用時間・最近使った項目を自動記録)
    settings/                # 設定・プラグイン管理画面
  plugins/                 # プラグイン SDK (renderer 側)
    types.ts                 # PluginModule 契約
    registry.ts               # ビルトインプラグインの静的レジストリ
    usePlugins.ts              # main のマニフェストと実装を突き合わせるフック
    usePluginStore.ts           # プラグイン専用永続ストレージ SDK
    useAiComplete.ts             # AI へ一括問い合わせして完全な応答を得るヘルパー (クイズ生成等で使用)
    builtin/                   # notes, todo, ai-chat, checklist, calendar, habits,
                                 # pomodoro, stopwatch, timer, calculator, unit-converter,
                                 # qr-generator, qr-reader, password-generator, world-clock,
                                 # ai-tutor, vocabulary, flashcards, quiz-generator,
                                 # study-timer, grades, study-notes, study-stats,
                                 # file-browser, file-tools, pdf-tools, document-viewer,
                                 # text-editor, image-editor, image-ocr, video-tools, audio-tools
  lib/
    ffmpeg.ts                 # ffmpeg.wasm の遅延ロード共有インスタンス (動画/音声ツールが利用)
    icoEncoder.ts               # PNG群から.icoを組み立てる自前エンコーダー

electron/ai/              # main process 側 AI 機能
  types.ts                  # AiProvider 共通契約
  lines.ts                   # SSE/NDJSON ストリーム読み取りヘルパー
  secureStore.ts              # APIキーを safeStorage で暗号化して保存
  index.ts                     # プロバイダーファクトリ・チャットセッション管理
  providers/                    # openai / anthropic / gemini / local (Ollama互換)

electron/files/
  pdfText.ts               # pdf-parse による PDF → テキスト抽出 (クイズ生成プラグインが利用)
  fsOps.ts                  # フォルダ/ファイル選択・一覧・ハッシュ・ごみ箱移動 等の実ファイルシステム操作
  zip.ts                     # jszip による ZIP 圧縮/解凍 (実ファイルパスを対象)

public/ffmpeg-core/       # ffmpeg.wasm のコア(js/wasm)をオフライン動作のため同梱 (CDN不要)

api/index.ts              # Vercel Serverless Function のエントリポイント (Express app を1本にまとめて公開)
server/                   # Web版バックエンドのロジック本体 (Vercel Functions から呼ばれる)
  db.ts                     # Neon (Postgres) への接続プール
  db/migrate.ts              # 冪等なスキーマ作成 (コールドスタート毎に1回だけ実行)
  auth/                       # password.ts (bcrypt), jwt.ts (JWT発行/検証), middleware.ts (認証ガード)
  routes/auth.ts               # signup/login/logout/me エンドポイント
  asyncHandler.ts              # Express 4 の async ルートハンドラのエラーを確実に catch する wrapper
vercel.json                # Vercel のビルド設定・/api/* のリライトルール
```

## アーキテクチャの要点

- **main / preload / renderer の分離**: `contextIsolation: true` + `nodeIntegration: false`。renderer は `window.api` (preload.ts で定義) 経由でのみ main と通信する。
- **IPC**: チャンネル名は `shared/types.ts` の `IPC` 定数で一元管理し、main (`electron/ipc/registerIpcHandlers.ts`) と preload の両方から参照する。
- **DB**: better-sqlite3 はネイティブビルドが必要で環境依存が大きいため、WASM 版の `sql.js` を採用。書き込み後はデバウンスして `userData/omnisuite.sqlite` に保存する。
- **プラグインシステム**: 有効/無効の永続状態は main プロセス (`PluginManager` + DB) が管理し、実際の React 実装は renderer 側 `src/plugins/registry.ts` で静的に解決する。将来的に外部プラグインフォルダからの動的ロードに拡張しやすいよう `PluginModule` 契約を分離してある。
- **クロスプラットフォーム/スマホ展開を見据えた設計**: renderer は `window.api` という薄い抽象を介してのみ OS 機能にアクセスするため、将来 Web/モバイル版を作る際はこの層を差し替えるだけで良い。
- **AI機能**: OpenAI / Anthropic / Gemini / ローカルLLM(Ollama互換) を共通の `AiProvider` インターフェースで抽象化 (`electron/ai/`)。API キーは `safeStorage` で OS レベル暗号化してから electron-store に保存し、renderer には絶対に渡さない。チャットはストリーミングで IPC イベント (`ai:chat:chunk` 等) 経由で配信される。
- **プラグイン専用ストレージ**: `usePluginStore` フック (`src/plugins/usePluginStore.ts`) が各プラグイン専用の名前空間で SQLite の `plugin_store` テーブルに永続化する。日常生活系プラグイン(チェックリスト・カレンダー・習慣管理・パスワード生成の設定等)はこれを利用し、専用の DB テーブルを増やさずに済むようにしている。
- **動画/音声処理**: Electron (Chromium) はプロプライエタリコーデックを標準搭載していないため、`<video>` 要素のデコードに頼らず **ffmpeg.wasm** (WASM版ffmpeg、独自にコーデックを内包) で変換・トリミング・GIF化・ノイズ除去等を行う。コア(js/wasm、約30MB)は `public/ffmpeg-core/` にオフライン用に同梱している。
- **実ファイルシステム操作**: フォルダ閲覧・ZIP圧縮/解凍・ハッシュ計算・重複検索・ごみ箱移動は renderer に fs アクセス権がないため main プロセス (`electron/files/fsOps.ts`, `zip.ts`) 経由の IPC で実行する。削除は完全削除ではなく OS のごみ箱への移動 (`shell.trashItem`) とし、復元可能な安全な操作にしている。

## Web版 (Vercel) バックエンド

デスクトップ版とは別に、Vercel 上でマルチユーザー対応の Web 版を動かすためのバックエンドを
`api/` (Vercel Functions) + `server/` (ロジック本体) に構築中。詳細設計は
`C:\Users\user\.claude\plans\encapsulated-crafting-grove.md` の計画書を参照。

- **DB**: Neon (Serverless Postgres)。`DATABASE_URL` 環境変数で接続 (`.env.example` を参照)
- **認証: ログイン画面なし (ブラウザ単位の自動匿名セッション)**。初回アクセス時に `POST /api/auth/anonymous` が匿名ユーザーを自動作成し、JWT を HttpOnly Cookie (`omnisuite_token`, 有効期限1年) に格納する。同じブラウザなら次回以降そのセッションが再利用され、他のブラウザ/ユーザーとはデータが混ざらない。メール/パスワードによるサインアップ・ログインは実装していない (`server/routes/auth.ts` は `/anonymous` と `/me` のみ)
- **ルーティング**: `api/index.ts` の Express app 1本に `/api/*` のリクエストをすべて集約 (`vercel.json` の rewrite)
- **エラーハンドリング**: Express 4 は async ハンドラの reject を自動catchしないため、全ルートを `server/asyncHandler.ts` でラップし、DB接続エラー等でプロセスが落ちずに 500 を返すようにしている
- **データAPI**: `server/repositories/*.ts` が `electron/db/repositories.ts` のロジックを Postgres + `user_id` スコープ向けに移植したもの。`server/routes/{settings,todos,notes,recent,usage,plugins}.ts` が対応する REST エンドポイントを提供し、すべて `requireAuth` + `migrationGate` ミドルウェアを経由する
- **renderer アダプタ層**: `src/lib/webApi.ts` が Electron の `window.api` (preload.ts) と全く同じ `OmniSuiteApi` インターフェースを `fetch` で実装。`src/main.tsx` が起動時に `window.api` が未定義 (=ブラウザ実行) なら自動的にこれを差し込むため、**プラグイン側のコードは1行も変更せずに Web で動作する**。`window.api.platform` (`"electron" | "web"`) で環境を判定し、`TitleBar` はWeb版でウィンドウ操作ボタンを非表示にする
- **セッションゲート**: `src/components/layout/AuthGate.tsx` がルートツリー全体をラップし、Web版では `checkAuth()` が既存セッションを確認 → 無ければ自動発行してから中身を表示する (ユーザーに見えるログイン画面は無い)。デスクトップ版は `window.api.auth` が常に固定ユーザーを返すスタブのため実質何もしない
- 現状は W1(バックエンド土台)・W2(コアデータAPI)・W3(rendererアダプタ層+匿名セッション+Webビルド)まで完了。AI連携・ファイルストレージは今後のフェーズ (W4〜W6) で追加する。Bucket C (file-browser/file-tools/pdf-tools/text-editor) はWeb版バックエンド未実装のため、Web版では「未対応」エラーを返す
- **セットアップ**: `.env.example` を `.env.local` にコピーして `DATABASE_URL` (Neonのダッシュボードで発行) と `JWT_SECRET` を設定してから `npm run dev:web` (`vercel dev`) で起動する。Vercelアカウント作成・プロジェクトのリンクはユーザー自身の操作が必要。Web用の静的ビルドをローカルで試すだけなら `VERCEL=1 npm run build:web` (Electronプラグインを含まない `dist/` が生成される)

## 実装済み機能一覧

- **AI**: AIチャット・AI家庭教師 (OpenAI/Anthropic/Gemini/ローカルLLM切り替え)
- **日常生活**: メモ・ToDo・チェックリスト・カレンダー・習慣管理・ポモドーロタイマー・ストップウォッチ・タイマー・電卓・単位変換・QRコード生成/読み取り・パスワードジェネレーター・世界時計
- **学習支援**: AI家庭教師・英単語帳・暗記カード・クイズ生成(PDF対応)・学習時間記録・成績管理・Markdownノート・勉強統計
- **ファイル管理**: ファイルブラウザ(検索/お気に入り)・ZIP圧縮/解凍・重複ファイル検索・ハッシュ確認・ファイル比較
- **ドキュメント**: PDF閲覧/結合/分割・Word/Excel閲覧・テキストエディター(Markdownプレビュー対応)
- **画像**: リサイズ・クロップ・回転・PNG/JPG/WebP変換・ICO生成・簡易背景除去・OCR
- **動画/音声**: 動画変換・トリミング・GIF作成・サムネイル生成・MP3/WAV変換・ノイズ除去・音量調整 (ffmpeg.wasm)

### 既知の制約・簡易実装であることの明記

- **背景除去**は AI(セグメンテーションモデル)ではなく、四隅の色に近いピクセルを透過する簡易的なヒューリスティックです。単色背景には有効ですが、複雑な写真背景には対応していません。
- **OCR** (tesseract.js) は初回利用時に言語モデルをインターネットからダウンロードします(以降はキャッシュされオフライン利用可)。
- **ノイズ除去**は ffmpeg の `afftdn` フィルターによる簡易処理で、専門的なノイズ除去ソフトほどの精度はありません。
- **動画/音声処理**は ffmpeg.wasm (シングルスレッド版) のため、大きなファイルや長時間の処理はネイティブ版ffmpegより低速です。

## 開発ロードマップ (今後のフェーズ)

現在完了しているのはフェーズ1〜10 (フォルダ構成・アーキテクチャ・コアシステム・UI・プラグインシステム・ホーム画面・AI機能の基盤・日常生活機能・学習支援機能・ファイル/ドキュメント/画像/動画/音声機能)。

AI機能は現時点で「AIチャット」「AI家庭教師」「クイズ生成」を実装済み。PDF要約・翻訳・コードレビュー等は同じ `AiProvider` 抽象を再利用して今後のフェーズで追加する。
学習支援系プラグイン間 (学習時間記録・クイズ生成・成績管理・勉強統計) は `plugin_store` を互いの `pluginId` 指定で読み合うことでデータ連携している (すべて同梱プラグインのため許容している設計上の割り切り)。

- [ ] Minecraft等ゲームツール
- [ ] 開発者ツール
- [ ] 最適化・テスト

### Web版ロードマップ (Vercel)

- [x] W1: バックエンド土台+認証 (Express on Vercel Functions, Neon, JWT認証)
- [x] W2: コアデータAPI (todo/notes/recent/usage/plugins)
- [x] W3: renderer アダプタ層 (`window.api` の Web実装) + ログイン画面 + Webビルド
- [ ] W4: AIプロキシ (プロバイダーAPIキーのサーバー側暗号化保存 + ストリーミング)
- [ ] W5: ファイルストレージ (Vercel Blob) + file-browser 等の再設計
- [ ] W6: 実デプロイ
