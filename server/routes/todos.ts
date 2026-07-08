import { Router } from "express";
import { requireAuth, type AuthedRequest } from "../auth/middleware";
import { migrationGate } from "../db/migrate";
import { asyncHandler } from "../asyncHandler";
import { todoRepo } from "../repositories/todos";

export const todosRouter = Router();
todosRouter.use(requireAuth, migrationGate);

todosRouter.get(
  "/",
  asyncHandler<AuthedRequest>(async (req, res) => {
    res.json(await todoRepo.list(req.userId!));
  })
);

todosRouter.post(
  "/",
  asyncHandler<AuthedRequest>(async (req, res) => {
    const { title } = (req.body ?? {}) as { title?: unknown };
    if (typeof title !== "string" || !title.trim()) {
      res.status(400).json({ error: "タイトルを入力してください" });
      return;
    }
    res.json(await todoRepo.upsert(req.userId!, req.body));
  })
);

todosRouter.delete(
  "/:id",
  asyncHandler<AuthedRequest>(async (req, res) => {
    await todoRepo.delete(req.userId!, req.params.id);
    res.status(204).end();
  })
);
