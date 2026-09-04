import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { config } from "../config.js";
import { User } from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

/* Brute-force guard on the credential routes only (free, local, no service). */
const credentialsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many attempts — try again in a few minutes." },
});

const registerSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(200),
  password: z.string().min(8).max(200),
});
const loginSchema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(1).max(200),
});

const publicUser = (u) => ({
  id: u._id.toString(),
  name: u.name,
  email: u.email,
  plan: u.plan,
  trialEndsAt: u.trialEndsAt,
  createdAt: u.createdAt,
});

function setSession(res, user) {
  // tv = tokenVersion — lets logout invalidate every issued token server-side.
  const token = jwt.sign({ sub: user._id.toString(), tv: user.tokenVersion }, config.jwtSecret, {
    expiresIn: "7d",
  });
  res.cookie(config.cookie.name, token, {
    httpOnly: true,
    sameSite: config.isProd ? "none" : "lax",
    secure: config.isProd,
    maxAge: config.cookie.maxAgeMs,
    path: "/",
  });
}

authRouter.post("/register", credentialsLimiter, async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: "Enter a name, a valid email, and a password of 8+ characters." });
    }
    const { name, email, password } = parsed.data;
    const passwordHash = await bcrypt.hash(password, 12);
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    try {
      const user = await User.create({ name, email, passwordHash, trialEndsAt });
      setSession(res, user);
      return res.status(201).json({ user: publicUser(user) });
    } catch (e) {
      if (e?.code === 11000) {
        return res.status(409).json({ error: "That email already has an account — log in instead." });
      }
      throw e;
    }
  } catch (err) {
    next(err);
  }
});

authRouter.post("/login", credentialsLimiter, async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Enter a valid email and password." });
    }
    const { email, password } = parsed.data;
    const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
    const ok = user && (await bcrypt.compare(password, user.passwordHash));
    // One generic message for both cases — never reveal which part was wrong.
    if (!ok) return res.status(401).json({ error: "Invalid email or password." });
    setSession(res, user);
    return res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/logout", async (req, res, next) => {
  try {
    const bearer = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : null;
    const token = req.cookies?.[config.cookie.name] || bearer;
    if (token) {
      try {
        const { sub } = jwt.verify(token, config.jwtSecret);
        // Revokes EVERY session for this user — DB-persisted, survives restarts.
        await User.findByIdAndUpdate(sub, { $inc: { tokenVersion: 1 } });
      } catch {
        /* expired/garbage token — nothing to revoke; still clear the cookie */
      }
    }
    res.clearCookie(config.cookie.name, { path: "/" });
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});
