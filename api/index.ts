import express, { type ErrorRequestHandler } from "express";
import cookieParser from "cookie-parser";
import { authRouter } from "../server/routes/auth";

/**
 * Vercel Serverless Function のエントリポイント。
 * vercel.json の rewrite で /api/* のリクエストをすべてこの関数にまとめて流し込み、
 * 内部の Express ルーターで振り分ける (Vercel での定番パターン)。
 *
 * DB マイグレーション (ensureMigrated) はここではなく、実際に DB へアクセスするルート
 * ハンドラ側で呼び出す。全リクエストの前段でブロックすると /api/health のような DB 不要な
 * エンドポイントや、入力バリデーションで弾けるはずのリクエストまで DB 接続待ちになってしまうため。
 */
const app = express();
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRouter);

// asyncHandler で catch されたエラーはここに集約される (DB接続不可等)。Express の規約により
// 4引数のミドルウェアを最後に置く必要がある。
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error("[api error]", err);
  res.status(500).json({ error: "サーバーエラーが発生しました" });
};
app.use(errorHandler);

export default app;
