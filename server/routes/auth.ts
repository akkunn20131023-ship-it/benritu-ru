import { randomUUID } from "node:crypto";
import { Router, type CookieOptions } from "express";
import { getPool } from "../db.js";
import { ensureMigrated } from "../db/migrate.js";
import { signToken, verifyToken } from "../auth/jwt.js";
import { requireAuth, AUTH_COOKIE_NAME, type AuthedRequest } from "../auth/middleware.js";
import { asyncHandler } from "../asyncHandler.js";

export const authRouter = Router();

const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 365 * 24 * 60 * 60 * 1000,
  path: "/",
};

/**
 * ログイン不要のブラウザ単位セッション。Cookie に有効なJWTが無ければ匿名ユーザーを
 * 新規作成して発行する (冪等: 既に有効なCookieがあればそれをそのまま返す)。
 */
authRouter.post(
  "/anonymous",
  asyncHandler(async (req, res) => {
    const existingToken = (req.cookies as Record<string, string> | undefined)?.[AUTH_COOKIE_NAME];
    if (existingToken) {
      try {
        const payload = verifyToken(existingToken);
        res.json({ id: payload.userId, email: payload.email });
        return;
      } catch {
        // 無効/期限切れのトークンなら新規発行に進む
      }
    }

    await ensureMigrated();
    const pool = getPool();
    const placeholderEmail = `anon-${randomUUID()}@omnisuite.local`;
    const result = await pool.query<{ id: string; email: string }>(
      "INSERT INTO users (email, password_hash) VALUES ($1, '') RETURNING id, email",
      [placeholderEmail]
    );
    const user = result.rows[0];
    const token = signToken({ userId: user.id, email: user.email });
    res.cookie(AUTH_COOKIE_NAME, token, COOKIE_OPTIONS);
    res.status(201).json({ id: user.id, email: user.email });
  })
);

authRouter.get("/me", requireAuth, (req: AuthedRequest, res) => {
  res.json({ id: req.userId, email: req.userEmail });
});
