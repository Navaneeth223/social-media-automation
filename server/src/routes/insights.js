import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { buildInsights } from "../services/insights.js";

export const insightsRouter = Router();

/* Every number comes from a real platform API response. Where the free tier
   doesn't expose a metric, the response says so instead of inventing one. */
insightsRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    res.json(await buildInsights(req.user._id));
  } catch (e) {
    next(e);
  }
});
