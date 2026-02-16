import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "node:path";

function resolveBasePath(rawPath?: string): string {
  const trimmed = rawPath?.trim() ?? "";
  if (!trimmed) {
    return "/";
  }
  return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
}

export default defineConfig({
  base: resolveBasePath(process.env.VITE_BASE_PATH),
  plugins: [vue()],
  resolve: {
    // Prefer source-of-truth files over generated artifacts in src/.
    extensions: [".vue", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".json"],
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@data": path.resolve(__dirname, "data")
    }
  },
  server: {
    proxy: {
      "/api/anthropic/messages": {
        target: "https://api.anthropic.com",
        changeOrigin: true,
        secure: true,
        headers: {
          "anthropic-dangerous-direct-browser-access": "true"
        },
        rewrite: () => "/v1/messages"
      },
      "/api/anthropic/models": {
        target: "https://api.anthropic.com",
        changeOrigin: true,
        secure: true,
        headers: {
          "anthropic-dangerous-direct-browser-access": "true"
        },
        rewrite: () => "/v1/models"
      },
      "/api/openai/chat/completions": {
        target: "https://api.openai.com",
        changeOrigin: true,
        secure: true,
        rewrite: () => "/v1/chat/completions"
      },
      "/api/openai/models": {
        target: "https://api.openai.com",
        changeOrigin: true,
        secure: true,
        rewrite: () => "/v1/models"
      },
      "/api/google": {
        target: "https://generativelanguage.googleapis.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/google/, "/v1beta")
      }
    }
  },
  test: {
    globals: true,
    environment: "jsdom",
    include: ["tests/**/*.test.ts"]
  }
});
