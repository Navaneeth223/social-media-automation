import mongoose from "mongoose";
import { encrypt } from "../services/crypto.js";

/*
 * One row per connected platform per user. Access tokens are encrypted at
 * rest (AES-256-GCM) the moment they arrive from OAuth — plain text never
 * touches the database.
 */
const platformAccountSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    platform: { type: String, required: true, enum: ["linkedin", "youtube", "instagram"] },
    platformAccountId: { type: String, required: true }, // urn:li:person:… or channel id
    displayName: { type: String, default: "" },
    email: { type: String, default: "" },
    accessTokenEnc: {
      type: String,
      required: true,
      set: (v) => encrypt(v), // encrypt transparently on assignment
    },
    // Google access tokens expire after ~1h — the refresh token is what keeps
    // scheduled uploads working days later. Encrypt it like any other token.
    refreshTokenEnc: {
      type: String,
      default: "",
      set: (v) => (v ? encrypt(v) : v),
    },
    expiresAt: { type: Date },
    scope: { type: String, default: "" },
    connectedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

platformAccountSchema.index({ user: 1, platform: 1 }, { unique: true });

export const PlatformAccount = mongoose.model("PlatformAccount", platformAccountSchema);
