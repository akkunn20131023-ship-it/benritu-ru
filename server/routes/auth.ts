import { Router, type CookieOptions } from "express";
import { getPool } from "../db";
import { ensureMigrated } from "../db/migrate";
import { hashPassword, verifyPassword } from "../auth/password";
import { signToken } from "../auth/jwt";
import { requireAuth, AUTH_COOKIE_NAME, type AuthedRequest } from "../auth/middleware";
import { asyncHandler } from "../asyncHandler";

export const authRouter = Router();

const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: "/",
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

authRouter.post(
  "/signup",
  asyncHandler(async (req, res) => {
    const { email, password } = (req.body ?? {}) as { email?: unknown; password?: unknown };

    if (typeof email !== "string" || !isValidEmail(email)) {
      res.status(400).json({ error: "有効なメールアドレスを入力してください" });
      return;
    }
    if (typeof password !== "string" || password.length < 8) {
      res.status(400).json({ error: "パスワードは8文字以上で入力してください" });
      return;
    }

    await ensureMigrated();
    const pool = getPool();
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: "このメールアドレスは既に登録されています" });
      return;
    }

    const passwordHash = await hashPassword(password);
    const result = await pool.query<{ id: string; email: string }>(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email",
      [email, passwordHash]
    );
    const user = result.rows[0];
    const token = signToken({ userId: user.id, email: user.email });
    res.cookie(AUTH_COOKIE_NAME, token, COOKIE_OPTIONS);
    res.status(201).json({ id: user.id, email: user.email });
  })
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = (req.body ?? {}) as { email?: unknown; password?: unknown };

    if (typeof email !== "string" || typeof password !== "string") {
      res.status(400).json({ error: "メールアドレスとパスワードを入力してください" });
      return;
    }

    await ensureMigrated();
    const pool = getPool();
    const result = await pool.query<{ id: string; email: string; password_hash: string }>(
      "SELECT id, email, password_hash FROM users WHERE email = $1",
      [email]
    );
    const user = result.rows[0];
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      res.status(401).json({ error: "メールアドレスまたはパスワードが違います" });
      return;
    }

    const token = signToken({ userId: user.id, email: user.email });
    res.cookie(AUTH_COOKIE_NAME, token, COOKIE_OPTIONS);
    res.json({ id: user.id, email: user.email });
  })
);

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, { path: "/" });
  res.status(204).end();
});

authRouter.get("/me", requireAuth, (req: AuthedRequest, res) => {
  res.json({ id: req.userId, email: req.userEmail });
});
