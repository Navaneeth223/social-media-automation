/*
 * Creates (or resets) the demo account against the local dev MongoDB.
 *   node scripts/seed.mjs
 *
 * Demo login: demo@pulse.app / demo12345 — re-run any time to reset the
 * trial window or the password.
 */
process.env.JWT_SECRET ||= "seed-does-not-sign-tokens";

import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/pulse";
const { connectDb } = await import("../src/db.js");
const { User } = await import("../src/models/User.js");

const DEMO = { name: "Demo User", email: "demo@pulse.app", password: "demo12345" };

try {
  await connectDb(uri);
  const passwordHash = await bcrypt.hash(DEMO.password, 12);
  await User.findOneAndUpdate(
    { email: DEMO.email },
    {
      $set: {
        name: DEMO.name,
        email: DEMO.email,
        passwordHash,
        plan: "trial",
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    },
    { upsert: true, setDefaultsOnInsert: true, new: true }
  );
  console.log("Demo account ready (reset every time you run this):");
  console.log("  login page : http://localhost:5173/login");
  console.log(`  email      : ${DEMO.email}`);
  console.log(`  password   : ${DEMO.password}`);
} finally {
  await mongoose.disconnect();
}
