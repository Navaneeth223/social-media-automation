import { Post } from "./models/Post.js";
import { PlatformAccount } from "./models/PlatformAccount.js";
import { publish as publishLinkedIn } from "./services/linkedin.js";
import { publish as publishYouTube } from "./services/youtube.js";

const PUBLISHERS = { linkedin: publishLinkedIn, youtube: publishYouTube };

/*
 * The scheduler. A Mongo-backed atomic-claim poller:
 *   - claims exactly one due post per tick with findOneAndUpdate
 *     (status scheduled → publishing) — two workers / a restart can never
 *     claim the same post twice,
 *   - publishes through the real platform service and records the real
 *     result (posted + platform id, or failed + the REAL error message),
 *   - never double-posts: a "publishing" claim older than 10 minutes is
 *     marked failed with an honest "interrupted — check your feed" message
 *     instead of being retried (a retry could post twice; LinkedIn has no
 *     idempotency key for posts).
 *
 * Upgrade path: swap this poller for BullMQ+Redis later — the publish
 * service and Post model don't change.
 */

const CLAIM_GRACE_MS = 10 * 60 * 1000;

export async function processOnce() {
  const now = new Date();

  const post = await Post.findOneAndUpdate(
    { status: "scheduled", scheduledFor: { $lte: now } },
    { $set: { status: "publishing", claimedAt: now } },
    { sort: { scheduledFor: 1 }, new: true }
  );

  if (post) {
    try {
      const account = await PlatformAccount.findOne({
        user: post.user,
        platform: post.platform,
      }).sort({ connectedAt: -1 });
      if (!account) throw new Error(`${post.platform === "youtube" ? "YouTube channel" : "LinkedIn account"} is no longer connected`);

      const result = await PUBLISHERS[post.platform]({ account, post });

      await Post.findByIdAndUpdate(post._id, {
        $set: { status: "posted", publishedAt: new Date(), publishedId: result.id },
        $unset: { error: 1 },
      });
    } catch (e) {
      await Post.findByIdAndUpdate(post._id, {
        $set: { status: "failed", error: e.message || "Publish failed" },
      });
    }
    return post._id;
  }

  // Crash recovery: a claim from a dead worker becomes a FAILED post, not a
  // retry — verify-on-feed instead of risk double-posting.
  const stale = await Post.findOneAndUpdate(
    {
      status: "publishing",
      claimedAt: { $lt: new Date(now.getTime() - CLAIM_GRACE_MS) },
    },
    {
      $set: {
        status: "failed",
        error:
          "Publishing was interrupted by a worker restart. Check your LinkedIn feed — it may have posted before the restart.",
      },
    }
  );
  return stale?._id ?? null;
}

export function startWorker({ intervalMs = 5000 } = {}) {
  let busy = false;
  const tick = async () => {
    if (busy) return;
    busy = true;
    try {
      await processOnce();
    } catch (e) {
      console.error("[worker]", e.message);
    } finally {
      busy = false;
    }
  };
  const timer = setInterval(tick, intervalMs);
  tick();
  console.log(`[worker] scheduler polling every ${intervalMs}ms`);
  return () => clearInterval(timer);
}
