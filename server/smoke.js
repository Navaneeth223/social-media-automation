/*
 * End-to-end smoke test for Phase 1 — runs the REAL app (same Express app,
 * same routes, same bcrypt/JWT/cookie code) against a throwaway in-memory
 * MongoDB, so it needs no Atlas cluster and no local Mongo:
 *
 *   cd server && npm run smoke
 */
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "smoke-test-secret";

import assert from "node:assert/strict";
import { MongoMemoryServer } from "mongodb-memory-server";

let failures = 0;
const step = async (name, fn) => {
  try {
    await fn();
    console.log("  ✓", name);
  } catch (e) {
    failures++;
    console.error("  ✗", name, "\n     ", e.message);
  }
};

console.log("Booting in-memory MongoDB…");
const mongod = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongod.getUri("pulse");

const { connectDb } = await import("./src/db.js");
const { createApp } = await import("./src/app.js");
const mongoose = (await import("mongoose")).default;

await connectDb(process.env.MONGODB_URI);
const app = createApp();
const server = app.listen(0);
const base = `http://127.0.0.1:${server.address().port}`;

const j = async (path, opts = {}) => {
  const res = await fetch(base + path, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
  });
  let data = null;
  try {
    data = await res.json();
  } catch {}
  return { status: res.status, data, cookies: res.headers.getSetCookie() };
};
const cookieOf = (r) =>
  (r.cookies.find((c) => c.startsWith("pulse_token=")) || "").split(";")[0];
const me = (cookie) => j("/api/auth/me", { headers: { Cookie: cookie } });
const PASSWORD = "correct-horse-battery";

try {
  await step("health reports db up", async () => {
    const r = await j("/api/health");
    assert.equal(r.status, 200);
    assert.equal(r.data.db, "up");
  });

  await step("register creates a real trial user + httpOnly session", async () => {
    const r = await j("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name: "Maya Chen", email: "maya@example.com", password: PASSWORD }),
    });
    assert.equal(r.status, 201);
    assert.equal(r.data.user.email, "maya@example.com");
    assert.equal(r.data.user.plan, "trial");
    assert.ok(new Date(r.data.user.trialEndsAt) > new Date());
    assert.ok(cookieOf(r).startsWith("pulse_token="), "session cookie set");
    assert.ok(!JSON.stringify(r.data).includes("$2"), "password hash never leaks");
  });

  await step("register rejects short passwords (400)", async () => {
    const r = await j("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name: "X", email: "x@example.com", password: "short" }),
    });
    assert.equal(r.status, 400);
  });

  await step("register rejects duplicate emails (409)", async () => {
    const r = await j("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name: "Maya Two", email: "maya@example.com", password: PASSWORD }),
    });
    assert.equal(r.status, 409);
  });

  await step("login with wrong password → generic 401", async () => {
    const r = await j("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "maya@example.com", password: "wrong-password" }),
    });
    assert.equal(r.status, 401);
    assert.equal(r.data.error, "Invalid email or password.");
  });

  await step("login with right password → 200 + cookie", async () => {
    const r = await j("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "maya@example.com", password: PASSWORD }),
    });
    assert.equal(r.status, 200);
    assert.ok(cookieOf(r).startsWith("pulse_token="));
  });

  await step("/me returns the signed-in user (cookie auth)", async () => {
    const login = await j("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "maya@example.com", password: PASSWORD }),
    });
    const r = await me(cookieOf(login));
    assert.equal(r.status, 200);
    assert.equal(r.data.user.name, "Maya Chen");
  });

  await step("/me also accepts Bearer tokens", async () => {
    const login = await j("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "maya@example.com", password: PASSWORD }),
    });
    const token = cookieOf(login).split("=")[1];
    const r = await j("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } });
    assert.equal(r.status, 200);
  });

  await step("/me without a session → 401", async () => {
    const r = await me("");
    assert.equal(r.status, 401);
  });

  await step("logout clears the session for good", async () => {
    const login = await j("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "maya@example.com", password: PASSWORD }),
    });
    const cookie = cookieOf(login);
    const out = await j("/api/auth/logout", { method: "POST", headers: { Cookie: cookie } });
    assert.equal(out.status, 200);
    const r = await me(cookie);
    assert.equal(r.status, 401);
  });

  await step("logout revokes every session, not just the cookie", async () => {
    const reg = await j("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name: "Ada Wait", email: "ada@example.com", password: PASSWORD }),
    });
    const cookieA = cookieOf(reg);
    const loginB = await j("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "ada@example.com", password: PASSWORD }),
    });
    const cookieB = cookieOf(loginB);
    assert.ok(cookieA.startsWith("pulse_token=") && cookieB.startsWith("pulse_token="));
    const out = await j("/api/auth/logout", { method: "POST", headers: { Cookie: cookieB } });
    assert.equal(out.status, 200);
    assert.equal((await me(cookieA)).status, 401, "older session dies too");
    assert.equal((await me(cookieB)).status, 401, "current session dies");
  });
} finally {
  server.close();
  await mongoose.disconnect();
  await mongod.stop();
}

console.log(
  failures
    ? `\n${failures} check(s) failed — fix before calling Phase 1 done.`
    : "\nAll Phase 1 checks passed — register → session → me → logout on the real app."
);
process.exit(failures ? 1 : 0);
