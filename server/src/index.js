import { config } from "./config.js";
import { connectDb } from "./db.js";
import { createApp } from "./app.js";
import { startWorker } from "./worker.js";

try {
  await connectDb();

  const app = createApp();
  const server = app.listen(config.port, () => {
    console.log(`Pulse API on http://localhost:${config.port} (db up · origin ${config.clientOrigin})`);
  });

  const stopWorker = startWorker({ intervalMs: 5000 });

  const shutdown = (sig) => {
    console.log(`${sig} — closing server, worker and db connection`);
    stopWorker();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 5000).unref();
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
} catch (err) {
  console.error("Failed to start the Pulse API:", err.message);
  console.error("Check MONGODB_URI (Atlas M0 string or local Mongo) and JWT_SECRET in server/.env");
  process.exit(1);
}
