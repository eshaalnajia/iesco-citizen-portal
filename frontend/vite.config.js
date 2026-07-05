import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { fileURLToPath, URL } from "node:url"
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.ico",
        "apple-touch-icon.png",
        "icons/*.png",
      ],
      manifest: {
        name:             "IESCO Smart Citizen Portal",
        short_name:       "IESCO Portal",
        description:      "Load shedding schedules, bill payment, and live electricity status for Islamabad",
        theme_color:      "#0D1B3E",
        background_color: "#0D1B3E",
        display:          "standalone",
        orientation:      "portrait-primary",
        start_url:        "/",
        scope:            "/",
        lang:             "en",
        icons: [
          { src: "/icons/icon-72.png",   sizes: "72x72",   type: "image/png" },
          { src: "/icons/icon-96.png",   sizes: "96x96",   type: "image/png" },
          { src: "/icons/icon-128.png",  sizes: "128x128", type: "image/png" },
          { src: "/icons/icon-144.png",  sizes: "144x144", type: "image/png" },
          { src: "/icons/icon-152.png",  sizes: "152x152", type: "image/png" },
          { src: "/icons/icon-192.png",  sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icons/icon-192-maskable.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "/icons/icon-384.png",  sizes: "384x384", type: "image/png" },
          { src: "/icons/icon-512.png",  sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
        shortcuts: [
          {
            name:       "Check Schedule",
            short_name: "Schedule",
            url:        "/schedule",
            icons: [{ src: "/icons/shortcut-schedule.png", sizes: "96x96" }],
          },
          {
            name:       "Pay Bill",
            short_name: "Billing",
            url:        "/billing",
            icons: [{ src: "/icons/shortcut-billing.png", sizes: "96x96" }],
          },
          {
            name:       "Live Map",
            short_name: "Map",
            url:        "/map",
            icons: [{ src: "/icons/shortcut-map.png", sizes: "96x96" }],
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,

        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/feeders"),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "iesco-feeders-cache",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/schedules"),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "iesco-schedules-cache",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 6 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/locations"),
            handler: "CacheFirst",
            options: {
              cacheName: "iesco-locations-cache",
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/tariffs"),
            handler: "CacheFirst",
            options: {
              cacheName: "iesco-tariffs-cache",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/bills"),
            handler: "NetworkOnly",
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/payments"),
            handler: "NetworkOnly",
          },
          {
            urlPattern: /^https:\/\/api\.mapbox\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "mapbox-tiles-cache",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],

        clientsClaim: true,
        skipWaiting:  true,

        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api/],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  esbuild: {
    drop: process.env.NODE_ENV === "production" ? ["console", "debugger"] : [],
  },
  test: {
    environment: "jsdom",
    setupFiles:  "./src/test/setup.js",
    globals:     true,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    allowedHosts: [".ngrok-free.dev", ".ngrok-free.app"],
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
})
