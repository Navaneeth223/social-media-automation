import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { User } from "../models/User.js";

/*
 * Accepts the httpOnly session cookie first, or an Authorization: Bearer header
 * (handy for the smoke test and any future mobile client).
 */
export async function requireAuth(req, res, next) {
  try {
    const bearer = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : null;
    const token = req.cookies?.[config.cookie.name] || bearer;
    if (!token) return res.status(401).json({ error: "Not signed in" });

    const payload = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ error: "Account no longer exists" });
    // Logout bumps tokenVersion — any older token dies right here.
    if (payload.tv !== user.tokenVersion) {
      return res.status(401).json({ error: "Session expired — sign in again" });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Session expired — sign in again" });
  }
}
