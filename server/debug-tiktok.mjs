/* Temporary debug: run the TikTok OAuth flow verbosely.  node debug-tiktok.mjs */
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "dbg";
process.env.TIKTOK_CLIENT_KEY = "k";
process.env.TIKTOK_CLIENT_SECRET = "s";

const { MongoMemoryServer } = await import("mongodb-memory-server");
const mongod = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongod.getUri("pulse-debug");

const realFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = String(input);
  if (url.includes("tiktokapis.com")) {
    console.log("[stub hit]", url.slice(0, 90));
    if (url.includes("/oauth/token/")) {
      return new Response(
        JSON.stringify({ access_token: "at", refresh_token: "rt", open_id: "oid", expires_in: 86400 }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    if (url.includes("/user/info/")) {
      return new Response(
        JSON.stringify({ data: { user: { open_id: "oid", display_name: "TikTok Demo" } }, error: { code: "ok" } }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
  }
  return realFetch(input, init);
};

const { connectDb } = await import("./src/db.js");
const { createApp } = await import("./src/app.js");
await connectDb(process.env.MONGODB_URI);
const app = createApp();
const server = app.listen(0);
const base = `http://127.0.0.1:${server.address().port}`;

const reg = await fetch(`${base}/api/auth/register`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "D", email: "d@d.com", password: "password123" }),
});
const cookie = reg.headers.getSetCookie()[0].split(";")[0];

const auth = await fetch(`${base}/api/auth/tiktok`, {
  headers: { Cookie: cookie },
  redirect: "manual",
});
console.log("authorize:", auth.status, auth.headers.get("location")?.slice(0, 90));
const state = new URL(auth.headers.get("location")).searchParams.get("state");
const stateCookie = auth.headers
  .getSetCookie()
  .find((c) => c.startsWith("tt_oauth_state="))
  .split(";")[0];

const cb = await fetch(`${base}/api/auth/tiktok/callback?code=c&state=${state}`, {
  headers: { Cookie: `${cookie}; ${stateCookie}` },
  redirect: "manual",
});
console.log("callback:", cb.status, cb.headers.get("location"));
console.log("callback body:", (await cb.text()).slice(0, 400));

const conns = await fetch(`${base}/api/connections`, { headers: { Cookie: cookie } });
console.log("connections:", await conns.text());

server.close();
process.exit(0);
