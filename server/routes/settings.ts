import { Router } from "express";
import { requireAuth, type AuthedRequest } from "../auth/middleware";
import { migrationGate } from "../db/migrate";
import { asyncHandler } from "../asyncHandler";
import { settingsRepo } from "../repositories/settings";
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
