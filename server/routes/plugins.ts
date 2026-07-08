import { Router } from "express";
import { requireAuth, type AuthedRequest } from "../auth/middleware.js";
import { migrationGate } from "../db/migrate.js";
import { asyncHandler } from "../asyncHandler.js";
import { pluginRepo, pluginStoreRepo } from "../repositories/plugins.js";

export const pluginsRouter = Router();
pluginsRouter.use(requireAuth, migrationGate);

pluginsRouter.get(
  "/",
  asyncHandler<AuthedRequest>(async (req, res) => {
    res.json(await pluginRepo.list(req.userId!));
  })
);

pluginsRouter.put(
  "/:id/enabled",
  asyncHandler<AuthedRequest>(async (req, res) => {
    const { enabled } = (req.body ?? {}) as { enabled?: unknown };
    if (typeof enabled !== "boolean") {
      res.status(400).json({ error: "enabled は真偽値で指定してください" });
      return;
    }
    await pluginRepo.setEnabled(req.userId!, req.params.id, enabled);
    res.status(204).end();
  })
);

pluginsRouter.get(
  "/:id/store/:key",
  asyncHandler<AuthedRequest>(async (req, res) => {
    const value = await pluginStoreRepo.get(req.userId!, req.params.id, req.params.key);
    res.json({ value });
  })
);

pluginsRouter.put(
  "/:id/store/:key",
  asyncHandler<AuthedRequest>(async (req, res) => {
    await pluginStoreRepo.set(req.userId!, req.params.id, req.params.key, (req.body ?? {}).value);
    res.status(204).end();
  })
);
