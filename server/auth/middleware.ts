import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "./jwt.js";

export const AUTH_COOKIE_NAME = "omnisuite_token";

export interface AuthedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

/** JWT (HttpOnly Cookie) を検証し、通過したリクエストに userId/userEmail を付与する */
export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const token = (req.cookies as Record<string, string> | undefined)?.[AUTH_COOKIE_NAME];
  if (!token) {
    res.status(401).json({ error: "認証が必要です" });
    return;
  }
  try {
    const payload = verifyToken(token);
    req.userId = payload.userId;
    req.userEmail = payload.email;
    next();
  } catch {
    res.status(401).json({ error: "セッションが無効です。再度ログインしてください" });
  }
}
