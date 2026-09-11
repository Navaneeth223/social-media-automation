import crypto from "node:crypto";
import { config } from "../config.js";

/*
 * AES-256-GCM encryption for platform access tokens at rest.
 * Format: iv.authTag.ciphertext (all base64). Rule #1 of the phase plan:
 * tokens are NEVER stored or logged in plain text.
 */
function key() {
  if (config.encryptionKey) return Buffer.from(config.encryptionKey, "base64");
  // Dev fallback: derive a stable key from JWT_SECRET (warn so prod setups notice).
  if (!config.isProd) {
    return crypto.createHash("sha256").update(config.jwtSecret).digest();
  }
  throw new Error("ENCRYPTION_KEY is required in production — set it in server/.env");
}

export function encrypt(plain) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), enc].map((b) => b.toString("base64")).join(".");
}

export function decrypt(payload) {
  if (!payload) return null;
  const [ivB, tagB, encB] = payload.split(".").map((s) => Buffer.from(s, "base64"));
  const decipher = crypto.createDecipheriv("aes-256-gcm", key(), ivB);
  decipher.setAuthTag(tagB);
  return Buffer.concat([decipher.update(encB), decipher.final()]).toString("utf8");
}
