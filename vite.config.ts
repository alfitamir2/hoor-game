// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

// Public (publishable) backend config. The publish build may not receive .env, so fall back to
// these safe public values; real env vars still take priority.
const PUBLIC_BACKEND_URL = process.env.VITE_SUPABASE_URL || "https://dpounqurteryzhtrribk.supabase.co";
const PUBLIC_BACKEND_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_dQsp8x7NKip0eDtYXgm9-g__g4SOzCr";
const PUBLIC_BACKEND_ID = process.env.VITE_SUPABASE_PROJECT_ID || "dpounqurteryzhtrribk";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(PUBLIC_BACKEND_URL),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(PUBLIC_BACKEND_KEY),
      "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(PUBLIC_BACKEND_ID),
    },
    plugins: [
      VitePWA({
        strategies: "generateSW",
        registerType: "autoUpdate",
        injectRegister: null,
        filename: "sw.js",
        outDir: "dist/client",
        manifest: false, // served from public/manifest.webmanifest
        devOptions: { enabled: false },
        workbox: {
          navigateFallback: null,
          globDirectory: "dist/client",
          // Keep HTML network-first: precaching it can pin a stale game after a release.
          globPatterns: ["**/*.{js,css,svg,png,jpg,woff2,webmanifest}"],
          maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
          globIgnores: ["**/*.apk"],
          runtimeCaching: [
            {
              urlPattern: ({ request, url }) =>
                request.mode === "navigate" && !url.pathname.startsWith("/~oauth"),
              handler: "NetworkFirst",
              options: { cacheName: "hoor-pages-v2", networkTimeoutSeconds: 15 },
            },
            {
              urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith("/assets/"),
              handler: "CacheFirst",
              options: { cacheName: "hoor-assets-v2", expiration: { maxEntries: 200 } },
            },
            {
              urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
              handler: "StaleWhileRevalidate",
              options: { cacheName: "hoor-fonts", cacheableResponse: { statuses: [0, 200] } },
            },
            {
              urlPattern: /^https:\/\/cdn\.tailwindcss\.com\/.*/,
              handler: "StaleWhileRevalidate",
              options: { cacheName: "hoor-cdn", cacheableResponse: { statuses: [0, 200] } },
            },
            {
              urlPattern: /\.mp3$/,
              handler: "CacheFirst",
              options: {
                cacheName: "hoor-recitations",
                expiration: { maxEntries: 60 },
                cacheableResponse: { statuses: [0, 200] },
                rangeRequests: true,
              },
            },
          ],
        },
      }),
    ],
  },
});
