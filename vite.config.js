import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
        // When the API is offline, answer with our JSON error shape instead of
        // a cryptic HTML 500, so the UI shows the friendly "start the stack" hint.
        configure: (proxy) => {
          proxy.on("error", (err, req, res) => {
            console.error(
              "\n[vite] Cannot reach the Pulse API on http://localhost:8787 — start the full stack with `npm run dev` (repo root).\n"
            );
            if (res && !res.headersSent) {
              res.writeHead(503, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  error:
                    "The Pulse API isn't running — start everything with `npm run dev` (repo root).",
                })
              );
            }
          });
        },
      },
    },
  },
});

