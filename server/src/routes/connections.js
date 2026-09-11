import { Router } from "express";
import { isConfigured as linkedinConfigured } from "../services/linkedin.js";
import { isConfigured as youtubeConfigured } from "../services/youtube.js";
import { PlatformAccount } from "../models/PlatformAccount.js";
import { requireAuth } from "../middleware/auth.js";

export const connectionsRouter = Router();

/* What this server can honestly do right now + what the user has connected. */
connectionsRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const accounts = await PlatformAccount.find({ user: req.user._id }).sort({ connectedAt: -1 });
    res.json({
      configured: { linkedin: linkedinConfigured(), youtube: youtubeConfigured() },
      connected: accounts.map((a) => ({
        platform: a.platform,
        displayName: a.displayName,
        platformAccountId: a.platformAccountId,
        connectedAt: a.connectedAt,
      })),
    });
  } catch (e) {
    next(e);
  }
});

connectionsRouter.delete("/:platform", requireAuth, async (req, res, next) => {
  try {
    await PlatformAccount.deleteOne({ user: req.user._id, platform: req.params.platform });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});
