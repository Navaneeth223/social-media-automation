import "dotenv/config";

const required = (name, fallback) => {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
};

export const config = {
  port: Number(process.env.PORT || 8787),
  // Defaults to local Mongo for dev; point MONGODB_URI at an Atlas M0 (free) in the cloud.
  mongoUri: required("MONGODB_URI", "mongodb://127.0.0.1:27017/pulse"),
  // No secret, no boot — secrets live in env vars only (never in code).
  jwtSecret: required("JWT_SECRET"),
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  // Platform tokens are encrypted at rest with AES-256-GCM. Set ENCRYPTION_KEY
  // to a 32-byte base64 key in production; in dev we derive one from JWT_SECRET.
  encryptionKey: process.env.ENCRYPTION_KEY || "",
  linkedin: {
    clientId: process.env.LINKEDIN_CLIENT_ID || "",
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET || "",
    redirectUri:
      process.env.LINKEDIN_REDIRECT_URI || "http://localhost:8787/api/auth/linkedin/callback",
  },
  instagram: {
    clientId: process.env.INSTAGRAM_CLIENT_ID || "",
    clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || "",
    redirectUri:
      process.env.INSTAGRAM_REDIRECT_URI || "http://localhost:8787/api/auth/instagram/callback",
  },
  tiktok: {
    clientKey: process.env.TIKTOK_CLIENT_KEY || "",
    clientSecret: process.env.TIKTOK_CLIENT_SECRET || "",
    redirectUri:
      process.env.TIKTOK_REDIRECT_URI || "http://localhost:8787/api/auth/tiktok/callback",
    // Sandbox-honest: SELF_ONLY (private to the uploader) is forced until the
    // app passes TikTok's audit. Flip via env once approved.
    privacyLevel: process.env.TIKTOK_PRIVACY_LEVEL || "SELF_ONLY",
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    redirectUri:
      process.env.GOOGLE_REDIRECT_URI || "http://localhost:8787/api/auth/youtube/callback",
  },
  isProd: process.env.NODE_ENV === "production",
  cookie: {
    name: "pulse_token",
    maxAgeMs: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
};
