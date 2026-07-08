import { Router } from "express";
import { requireAuth, type AuthedRequest } from "../auth/middleware.js";
import { migrationGate } from "../db/migrate.js";
import { asyncHandler } from "../asyncHandler.js";
import { usageRepo } from "../repositories/usage.js";

export const usageRouter = Router();
usageRouter.use(requireAuth, migrationGate);

usageRouter.get(
  "/",
  asyncHandler<AuthedRequest>(async (req, res) => {
    res.json(await usageRepo.list(req.userId!));
  })
);

usageRouter.post(
  "/track",
  asyncHandler<AuthedRequest>(async (req, res) => {
    const { featureId, deltaMs } = (req.body ?? {}) as { featureId?: unknown; deltaMs?: unknown };
    if (typeof featureId !== "string" || typeof deltaMs !== "number") {
      res.status(400).json({ error: "featureId と deltaMs が必要です" });
      return;
    }
    await usageRepo.track(req.userId!, featureId, deltaMs);
    res.status(204).end();
  })
);
