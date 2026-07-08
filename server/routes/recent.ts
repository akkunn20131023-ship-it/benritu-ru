import { Router } from "express";
import { requireAuth, type AuthedRequest } from "../auth/middleware";
import { migrationGate } from "../db/migrate";
import { asyncHandler } from "../asyncHandler";
import { recentRepo } from "../repositories/recent";

export const recentRouter = Router();
recentRouter.use(requireAuth, migrationGate);

recentRouter.get(
  "/",
  asyncHandler<AuthedRequest>(async (req, res) => {
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    res.json(await recentRepo.list(req.userId!, limit));
  })
);

recentRouter.post(
  "/",
  asyncHandler<AuthedRequest>(async (req, res) => {
    const { label, featureId, path } = (req.body ?? {}) as { label?: unknown; featureId?: unknown; path?: unknown };
    if (typeof label !== "string" || typeof featureId !== "string") {
      res.status(400).json({ error: "label と featureId が必要です" });
      return;
    }
    res.json(await recentRepo.push(req.userId!, { label, featureId, path: typeof path === "string" ? path : undefined }));
  })
);
