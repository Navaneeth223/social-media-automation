import mongoose from "mongoose";

/*
 * Phase 1: the user account itself.
 * Phase 2 will add a PlatformAccount model holding OAuth tokens — those get
 * encrypted at rest with a server-side key before they ever touch the DB.
 */
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // bcrypt hash (12 rounds) — select:false so it never rides along by accident.
    passwordHash: { type: String, required: true, select: false },
    // Bumped on logout so every issued JWT dies instantly (checked in requireAuth).
    tokenVersion: { type: Number, default: 0 },
    plan: { type: String, enum: ["trial"], default: "trial" },
    trialEndsAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
