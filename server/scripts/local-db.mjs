/*
 * Zero-install local MongoDB for development.
 *
 * Reuses the mongod binary that mongodb-memory-server already downloaded for
 * the smoke test — but runs it against a REAL on-disk data directory
 * (server/.local-db), so data persists across restarts. No MongoDB install,
 * no Docker, no cloud needed.
 *
 *   node scripts/local-db.mjs up       # start (no-op if already running)
 *   node scripts/local-db.mjs down     # stop
 *   node scripts/local-db.mjs status   # is it up?
 *
 * The API reaches it at mongodb://127.0.0.1:27017/pulse (the default in
 * server/.env).
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(here, "..");
const PORT = 27017;
const dataDir = path.join(serverRoot, ".local-db");
const logFile = path.join(serverRoot, ".local-db.log");
const pidFile = path.join(dataDir, "mongod.pid");

const probe = (timeoutMs = 400) =>
  new Promise((resolve) => {
    const sock = net.connect({ host: "127.0.0.1", port: PORT });
    sock.setTimeout(timeoutMs);
    sock.on("connect", () => {
      sock.destroy();
      resolve(true);
    });
    sock.on("error", () => resolve(false));
    sock.on("timeout", () => {
      sock.destroy();
      resolve(false);
    });
  });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function findMongod() {
  // mongodb-memory-server's flat cache: mongod-x64-win32-<version>.exe etc.
  const cacheRoot =
    process.platform === "win32"
      ? path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local"), "..", ".cache", "mongodb-binaries")
      : path.join(os.homedir(), ".cache", "mongodb-binaries");
  const candidates = [
    cacheRoot,
    path.join(process.env.USERPROFILE || os.homedir(), ".cache", "mongodb-binaries"),
    path.join(serverRoot, "node_modules", ".cache", "mongodb-binaries"),
  ];
  const hits = [];
  for (const root of [...new Set(candidates)]) {
    let entries;
    try {
      entries = fs.readdirSync(root);
    } catch {
      continue;
    }
    for (const name of entries) {
      if (name.startsWith("mongod") && name.endsWith(".exe")) {
        hits.push(path.join(root, name));
      } else if (name === "mongod") {
        hits.push(path.join(root, name));
      }
    }
  }
  if (hits.length === 0) {
    console.error(
      "No cached mongod binary found.\n" +
        "Run `npm run smoke` inside server/ once (downloads one), or install MongoDB."
    );
    process.exit(1);
  }
  return hits.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
}

const cmd = process.argv[2] || "status";

if (cmd === "status") {
  console.log((await probe()) ? `MongoDB running on 127.0.0.1:${PORT}` : "MongoDB not running");
  process.exit(0);
}

if (cmd === "down") {
  if (fs.existsSync(pidFile)) {
    const pid = Number(fs.readFileSync(pidFile, "utf8").trim());
    try {
      if (process.platform === "win32") {
        spawn("taskkill", ["/PID", String(pid), "/F"], { stdio: "ignore" });
      } else {
        process.kill(pid, "SIGTERM");
      }
    } catch {
      /* already gone */
    }
    fs.unlinkSync(pidFile);
  }
  for (let i = 0; i < 20 && (await probe()); i++) await sleep(200);
  console.log("MongoDB stopped");
  process.exit(0);
}

if (cmd === "up") {
  if (await probe()) {
    console.log(`MongoDB already running on 127.0.0.1:${PORT} — nothing to do`);
    process.exit(0);
  }
  const mongod = findMongod();
  fs.mkdirSync(dataDir, { recursive: true });
  const child = spawn(
    mongod,
    [
      "--dbpath",
      dataDir,
      "--port",
      String(PORT),
      "--bind_ip",
      "127.0.0.1",
      "--logpath",
      logFile,
      "--logappend",
    ],
    { stdio: "ignore", detached: true }
  );
  child.unref();
  fs.writeFileSync(pidFile, String(child.pid));

  for (let i = 0; i < 60; i++) {
    await sleep(300);
    if (await probe()) {
      console.log(`MongoDB ready on 127.0.0.1:${PORT}`);
      console.log(`  binary : ${mongod}`);
      console.log(`  data   : ${dataDir} (persists across restarts)`);
      process.exit(0);
    }
  }
  console.error("mongod did not become ready in 18s — check server/.local-db.log");
  process.exit(1);
}
