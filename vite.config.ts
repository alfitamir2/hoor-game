// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
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
          globPatterns: ["**/*.{js,css,svg,png,jpg,woff2,webmanifest}"],
          maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
          globIgnores: ["**/*.apk", "**/Hoor-Plays-Learns-Android.html"],
          runtimeCaching: [
            {
              urlPattern: ({ request, url }) =>
                request.mode === "navigate" && !url.pathname.startsWith("/~oauth"),
              handler: "NetworkFirst",
              options: { cacheName: "hoor-pages", networkTimeoutSeconds: 4 },
            },
            {
              urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith("/assets/"),
              handler: "CacheFirst",
              options: { cacheName: "hoor-assets", expiration: { maxEntries: 200 } },
            },
            {
              urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
              handler: "StaleWhileRevalidate",
              options: { cacheName: "hoor-fonts" },
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
