import { PlatformAccount } from "../models/PlatformAccount.js";
import { Post } from "../models/Post.js";
import { ensureFreshAccessToken as ensureYouTubeToken } from "./youtube.js";
import { ensureFreshAccessToken as ensureInstagramToken } from "./instagram.js";

/*
 * Phase 6 — dashboard truth. Every number here comes from the platform's own
 * API. Where a platform doesn't expose metrics on its free tier, we return
 * { available: false, reason } and the UI shows that — never an invented
 * number. Platform API failures surface the REAL error too.
 */

const YT_API = "https://www.googleapis.com/youtube/v3";
const IG_GRAPH = "https://graph.instagram.com/v23.0";

async function youtubeInsights(userId) {
  const account = await PlatformAccount.findOne({ user: userId, platform: "youtube" }).sort({
    connectedAt: -1,
  });
  if (!account) return { available: false, reason: "YouTube not connected" };
  const token = await ensureYouTubeToken(account);

  const chRes = await fetch(`${YT_API}/channels?part=snippet,statistics&mine=true`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!chRes.ok) {
    const d = await chRes.json().catch(() => ({}));
    throw new Error(d.error?.message || `YouTube channels.list failed (${chRes.status})`);
  }
  const ch = (await chRes.json()).items?.[0];
  if (!ch) return { available: false, reason: "This Google account has no YouTube channel" };

  // Real per-video stats for the videos WE published through Pulse (1 quota unit).
  const ourPosts = await Post.find({
    user: userId,
    platform: "youtube",
    status: "posted",
    publishedId: { $ne: null },
  }).limit(50);
  const ids = ourPosts.map((p) => p.publishedId);
  let items = [];
  if (ids.length) {
    const vRes = await fetch(`${YT_API}/videos?part=snippet,statistics&id=${ids.join(",")}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!vRes.ok) {
      const d = await vRes.json().catch(() => ({}));
      throw new Error(d.error?.message || `YouTube videos.list failed (${vRes.status})`);
    }
    items = (await vRes.json()).items || [];
  }

  return {
    available: true,
    channel: {
      id: ch.id,
      title: ch.snippet?.title || "YouTube channel",
      subscribers: Number(ch.statistics?.subscriberCount ?? 0),
      views: Number(ch.statistics?.viewCount ?? 0),
      videoCount: Number(ch.statistics?.videoCount ?? 0),
    },
    posts: ourPosts.map((p) => {
      const it = items.find((x) => x.id === p.publishedId);
      return {
        postId: p._id.toString(),
        videoId: p.publishedId,
        title: it?.snippet?.title || p.title || "(untitled)",
        views: Number(it?.statistics?.viewCount ?? 0),
        likes: Number(it?.statistics?.likeCount ?? 0),
        comments: Number(it?.statistics?.commentCount ?? 0),
        url: `https://www.youtube.com/watch?v=${p.publishedId}`,
      };
    }),
  };
}

async function instagramInsights(userId) {
  const account = await PlatformAccount.findOne({ user: userId, platform: "instagram" }).sort({
    connectedAt: -1,
  });
  if (!account) return { available: false, reason: "Instagram not connected" };
  const token = await ensureInstagramToken(account);

  const p = new URLSearchParams({
    fields: "id,caption,permalink,timestamp,media_type,like_count,comments_count",
    limit: "12",
    access_token: token,
  });
  const res = await fetch(`${IG_GRAPH}/${account.platformAccountId}/media?${p}`);
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.error?.message || `Instagram media list failed (${res.status})`);
  }
  const data = await res.json();

  return {
    available: true,
    username: account.displayName,
    media: (data.data || []).map((m) => ({
      id: m.id,
      type: m.media_type,
      url: m.permalink,
      caption: (m.caption || "").slice(0, 90),
      timestamp: m.timestamp,
      likes: m.like_count ?? 0,
      comments: m.comments_count ?? 0,
    })),
  };
}

export async function buildInsights(userId) {
  const insights = {};
  for (const [name, fn] of [
    ["youtube", youtubeInsights],
    ["instagram", instagramInsights],
  ]) {
    try {
      insights[name] = await fn(userId);
    } catch (e) {
      // Real API failure — surface the REAL message, never a fake number.
      insights[name] = { available: false, error: e.message };
    }
  }
  insights.linkedin = {
    available: false,
    reason:
      "LinkedIn doesn't expose member-level post analytics on the free tier — publish history only.",
  };
  insights.tiktok = {
    available: false,
    reason: "TikTok analytics aren't part of the free Content Posting API.",
  };
  return insights;
}
