import { Router } from "express";
import { requireAuth, type AuthedRequest } from "../auth/middleware.js";
import { migrationGate } from "../db/migrate.js";
import { asyncHandler } from "../asyncHandler.js";
import { settingsRepo } from "../repositories/settings.js";
import type { AppSettings } from "../../shared/types";

export const settingsRouter = Router();
settingsRouter.use(requireAuth, migrationGate);

settingsRouter.get(
  "/",
  asyncHandler<AuthedRequest>(async (req, res) => {
    res.json(await settingsRepo.getAll(req.userId!));
  })
);

settingsRouter.put(
  "/:key",
  asyncHandler<AuthedRequest>(async (req, res) => {
    const key = req.params.key as keyof AppSettings;
    const { value } = (req.body ?? {}) as { value?: unknown };
    res.json(await settingsRepo.set(req.userId!, key, value as never));
  })
);
