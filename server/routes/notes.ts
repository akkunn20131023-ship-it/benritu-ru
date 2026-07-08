import { Router } from "express";
import { requireAuth, type AuthedRequest } from "../auth/middleware.js";
import { migrationGate } from "../db/migrate.js";
import { asyncHandler } from "../asyncHandler.js";
import { noteRepo } from "../repositories/notes.js";

export const notesRouter = Router();
notesRouter.use(requireAuth, migrationGate);

notesRouter.get(
  "/",
  asyncHandler<AuthedRequest>(async (req, res) => {
    res.json(await noteRepo.list(req.userId!));
  })
);

notesRouter.post(
  "/",
  asyncHandler<AuthedRequest>(async (req, res) => {
    const { title } = (req.body ?? {}) as { title?: unknown };
    if (typeof title !== "string" || !title.trim()) {
      res.status(400).json({ error: "タイトルを入力してください" });
      return;
    }
    res.json(await noteRepo.upsert(req.userId!, req.body));
  })
);

notesRouter.delete(
  "/:id",
  asyncHandler<AuthedRequest>(async (req, res) => {
    await noteRepo.delete(req.userId!, req.params.id);
    res.status(204).end();
  })
);
