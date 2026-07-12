import { Router } from "express";
import { listEntries } from "../db";
import { computeInsights } from "../services/insights";

export const insightsRouter = Router();

insightsRouter.get("/", (_req, res) => {
  const entries = listEntries(500);
  res.json(computeInsights(entries));
});
