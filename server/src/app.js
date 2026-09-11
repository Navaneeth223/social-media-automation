import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import { config } from "./config.js";
import { authRouter } from "./routes/auth.js";
import { oauthRouter } from "./routes/oauth.js";
import { connectionsRouter } from "./routes/connections.js";
import { postsRouter } from "./routes/posts.js";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1); // Render/Railway sit behind a reverse proxy
  app.use(helmet());
  app.use(cors({ origin: config.clientOrigin, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  app.get("/api/health", (req, res) => {
    res.json({ ok: true, db: mongoose.connection.readyState === 1 ? "up" : "down" });
  });

  // Friendly 503 (never a raw 500) when the local database isn't running.
  app.use("/api", (req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error:
          "Database not connected — run `npm run db:up` (repo root), then restart the API (`npm run dev`).",
      });
    }
    next();
  });

  app.use("/api/auth", authRouter);
  app.use("/api/auth", oauthRouter);
  app.use("/api/connections", connectionsRouter);
  app.use("/api/posts", postsRouter);

  app.use((req, res) => res.status(404).json({ error: "Not found" }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = err.status || 500;
    if (status >= 500) console.error(err);
    res.status(status).json({
      error: status >= 500 ? "Something went wrong on our side." : err.message,
    });
  });

  return app;
}
