import mongoose from "mongoose";

/*
 * A scheduled/published social post. Lifecycle:
 *   scheduled → publishing → posted | failed
 * The scheduler claims atomically (see server/src/worker.js) so a worker
 * restart can never claim or publish the same post twice.
 */
const postSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    platform: { type: String, required: true, enum: ["linkedin", "youtube"] },
    text: { type: String, trim: true, maxlength: 3000, default: "" }, // LinkedIn commentary
    // YouTube-specific fields (videos.insert):
    title: { type: String, trim: true, maxlength: 100, default: "" },
    videoUrl: { type: String, default: "" }, // public https URL of the video file
    description: { type: String, trim: true, maxlength: 5000, default: "" },
    privacyStatus: {
      type: String,
      enum: ["private", "unlisted", "public"],
      default: "private",
    },
    status: {
      type: String,
      enum: ["scheduled", "publishing", "posted", "failed"],
      default: "scheduled",
      index: true,
    },
    scheduledFor: { type: Date, required: true },
    publishedAt: { type: Date },
    publishedId: { type: String }, // real id returned by the platform API
    error: { type: String, default: "" }, // real API error text when failed
    claimedAt: { type: Date },
  },
  { timestamps: true }
);

postSchema.index({ status: 1, scheduledFor: 1 });

export const Post = mongoose.model("Post", postSchema);
