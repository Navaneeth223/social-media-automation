import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { Post } from "../models/Post.js";
import { PlatformAccount } from "../models/PlatformAccount.js";
import { publishPost, isConfigured } from "../services/linkedin.js";

export const postsRouter = Router();
const sanitize = (p) => ({
  id: p._id.toString(),
  platform: p.platform,
  text: p.text,
  status: p.status,
  scheduledFor: p.scheduledFor,
  publishedAt: p.publishedAt,
  publishedId: p.publishedId,
  error: p.error,
  createdAt: p.createdAt,
});

const createSchema = z.object({
  text: z.string().trim().min(1).max(3000),
  scheduledFor: z.string().datetime().optional(),
  publishNow: z.boolean().optional(),
});

postsRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Write something (1–3000 characters) to post." });
    }
    const { text, scheduledFor, publishNow } = parsed.data;
    const platform = "linkedin"; // Phase 2 platform — more follow per the phase plan

    /* Post now → real LinkedIn API call, real success or real error. */
    if (publishNow) {
      if (!isConfigured()) {
        return res.status(400).json({
          error:
            "LinkedIn isn't configured on this server — add LINKEDIN_CLIENT_ID / LINKEDIN_CLIENT_SECRET to server/.env and restart the API.",
        });
      }
      const account = await PlatformAccount.findOne({
        user: req.user._id,
        platform,
      }).sort({ connectedAt: -1 });
      if (!account) {
        return res.status(400).json({ error: "Connect LinkedIn first, then post instantly." });
      }

      const post = await Post.create({
        user: req.user._id,
        platform,
        text,
        status: "publishing",
        scheduledFor: new Date(),
        claimedAt: new Date(),
      });
      try {
        const result = await publishPost({
          accessTokenEnc: account.accessTokenEnc,
          memberUrn: account.platformAccountId,
          text,
        });
        post.status = "posted";
        post.publishedAt = new Date();
        post.publishedId = result.id;
      } catch (e) {
        post.status = "failed";
        post.error = e.message;
      }
      await post.save();
      return res.status(201).json({ post: sanitize(post) });
    }

    /* Schedule → the worker publishes it at the right moment. */
    const when = scheduledFor ? new Date(scheduledFor) : null;
    if (!when || Number.isNaN(when.getTime())) {
      return res.status(400).json({ error: "Pick a valid date and time to schedule." });
    }
    const post = await Post.create({
      user: req.user._id,
      platform,
      text,
      status: "scheduled",
      scheduledFor: when,
    });
    return res.status(201).json({ post: sanitize(post) });
  } catch (e) {
    next(e);
  }
});

postsRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const posts = await Post.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
    res.json({ posts: posts.map(sanitize) });
  } catch (e) {
    next(e);
  }
});

/* Only pending posts can be deleted — history is history. */
postsRouter.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, user: req.user._id });
    if (!post) return res.status(404).json({ error: "Post not found." });
    if (post.status !== "scheduled") {
      return res.status(400).json({ error: "Only scheduled posts can be deleted." });
    }
    await post.deleteOne();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});
