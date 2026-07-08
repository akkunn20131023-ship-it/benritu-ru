import { Router } from "express";
import { fetchNews } from "../../shared/fetchNews.js";
import { asyncHandler } from "../asyncHandler.js";

export const newsRouter = Router();

newsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(await fetchNews());
  })
);
