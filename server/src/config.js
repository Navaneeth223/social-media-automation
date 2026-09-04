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
  isProd: process.env.NODE_ENV === "production",
  cookie: {
    name: "pulse_token",
    maxAgeMs: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
};
