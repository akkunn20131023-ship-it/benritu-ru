# Mytnela Flow リアルタイム共通基盤 サーバー

オンライン機能（チャット・共同メモ・共同ToDo・ホワイトボード・ゲーム等）の共通リレーサーバー。
**アカウント登録・ログイン・メール不要**。参加はルームコード / 招待URL / QR のみ。

## 特徴

- ルーム管理（コードで入退室）と在室者(presence)配信
- ルームごとの**権威シーケンス採番**でメッセージ順序を保証し「同期ずれ」を検知可能に
- **重複送信の抑制**（送信者+メッセージIDで直近を記憶）
- **ホスト選出・自動ホスト移譲**（ホスト離脱時）
- **切断検知**（heartbeat）／再接続は同一 clientId の再 join で復帰
- **レート制限**（接続ごとトークンバケット）・**ルーム最大人数** … 荒らし対策の土台
- **メンテナンスモード** / 構造化ログ（JSON Lines）
- 監視用 HTTP: `GET /health`、`GET /metrics`（利用統計。管理ダッシュボードの土台）
- プロトコルは version:1（将来のサーバー実装と互換）
- CAPTCHA 拡張の余地：join に任意の `token` を受理する設計（現状は検証せず素通し）

## 起動

```bash
npm run realtime          # ポート 8787 で起動
```

## 環境変数

| 変数 | 既定 | 説明 |
|------|------|------|
| `PORT` | `8787` | 待受ポート |
| `HOST` | `0.0.0.0` | 待受ホスト |
| `MAX_ROOM_SIZE` | `16` | 1ルームの最大人数 |
| `RATE_CAPACITY` | `20` | レート制限バケット容量 |
| `RATE_REFILL_PER_SEC` | `10` | 毎秒の回復トークン数 |
| `MAINTENANCE` | `` | `1` で新規 join を停止（メンテナンス） |
| `ADMIN_TOKEN` | `` | 設定すると `/metrics?token=...` を要求 |
| `ALLOW_ORIGIN` | `*` | `/health` `/metrics` の CORS 許可オリジン |

## デプロイ

WebSocket を維持できる常駐ホスト（Render / Fly.io / Railway / VPS など）に配置し、
フロントエンドの環境変数 `VITE_REALTIME_URL=wss://<配置先>` を設定する。
静的ホスティング（Vercel/Netlify/Cloudflare Pages）はフロントエンド用、本サーバーは別ホストで運用する構成。

## フロントエンド側の利用

```ts
import { useRoom, generateRoomCode } from "@/lib/realtime";
const { status, peers, isHost, inviteUrl, send } = useRoom({ featureId: "my-feature", code });
```
