import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { Post } from "../models/Post.js";
import { PlatformAccount } from "../models/PlatformAccount.js";
import { isConfigured as linkedinConfigured, publish as publishLinkedIn } from "../services/linkedin.js";
import { isConfigured as youtubeConfigured, publish as publishYouTube } from "../services/youtube.js";

export const postsRouter = Router();

const PUBLISHERS = { linkedin: publishLinkedIn, youtube: publishYouTube };
const CONFIG_CHECKS = { linkedin: linkedinConfigured, youtube: youtubeConfigured };
const LABELS = { linkedin: "LinkedIn", youtube: "YouTube" };

const sanitize = (p) => ({
  id: p._id.toString(),
  platform: p.platform,
  text: p.text,
  title: p.title,
  videoUrl: p.videoUrl,
  description: p.description,
  privacyStatus: p.privacyStatus,
  status: p.status,
  scheduledFor: p.scheduledFor,
  publishedAt: p.publishedAt,
  publishedId: p.publishedId,
  error: p.error,
  createdAt: p.createdAt,
});

const baseSchema = z.object({
  platform: z.enum(["linkedin", "youtube"]).default("linkedin"),
  scheduledFor: z.string().datetime().optional(),
  publishNow: z.boolean().optional(),
});
const linkedinSchema = z.object({ text: z.string().trim().min(1).max(3000) });
const youtubeSchema = z.object({
  title: z.string().trim().min(1).max(100),
  videoUrl: z.string().trim().url(),
  description: z.string().trim().max(5000).optional().default(""),
  privacyStatus: z.enum(["private", "unlisted", "public"]).optional().default("private"),
});

postsRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const base = baseSchema.safeParse(req.body);
    if (!base.success) return res.status(400).json({ error: "Unknown platform." });
    const platform = base.data.platform;

    /* Per-platform content validation — a YouTube post is a video + title. */
    const content =
      platform === "youtube"
        ? youtubeSchema.safeParse(req.body)
        : linkedinSchema.safeParse(req.body);
    if (!content.success) {
      return res.status(400).json({
        error:
          platform === "youtube"
            ? "A title (1–100 chars) and a valid https video URL are required."
            : "Write something (1–3000 characters) to post.",
      });
    }
    const fields = content.data;

    /* Post now → real platform API call, real success or real error. */
    if (base.data.publishNow) {
      if (!CONFIG_CHECKS[platform]()) {
        return res.status(400).json({
          error: `${LABELS[platform]} isn't configured on this server — add the ${platform === "youtube" ? "GOOGLE" : "LINKEDIN"}_CLIENT_ID / CLIENT_SECRET to server/.env and restart the API.`,
        });
      }
      const account = await PlatformAccount.findOne({ user: req.user._id, platform }).sort({
        connectedAt: -1,
      });
      if (!account) {
        return res.status(400).json({ error: `Connect ${LABELS[platform]} first, then post instantly.` });
      }

      const post = await Post.create({
        user: req.user._id,
        platform,
        ...fields,
        status: "publishing",
        scheduledFor: new Date(),
        claimedAt: new Date(),
      });
      try {
        const result = await PUBLISHERS[platform]({ account, post });
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
    const when = base.data.scheduledFor ? new Date(base.data.scheduledFor) : null;
    if (!when || Number.isNaN(when.getTime())) {
      return res.status(400).json({ error: "Pick a valid date and time to schedule." });
    }
    const post = await Post.create({
      user: req.user._id,
      platform,
      ...fields,
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
