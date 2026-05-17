import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  test: {
    environment: "node",
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "GastosPro — Life Pro",
        short_name: "Life Pro",
        description: "Finanzas, compras, hogar y bienestar en una sola app",
        theme_color: "#1e293b",
        background_color: "#0f172a",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "/favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "maskable",
          },
        ],
        shortcuts: [
          {
            name: "Agregar gasto",
            short_name: "Nuevo gasto",
            description: "Registrar un movimiento en el mes actual",
            url: "/nuevo-gasto",
            icons: [{ src: "/favicon.svg", sizes: "96x96" }],
          },
          {
            name: "Lista super",
            short_name: "Super",
            description: "Modo supermercado — lista del super",
            url: "/lista-super",
            icons: [{ src: "/favicon.svg", sizes: "96x96" }],
          },
        ],
      },
      workbox: {
        navigateFallback: "index.html",
        globPatterns: ["**/*.{js,css,html,svg,woff2}"],
        runtimeCaching: [
          {
            // Cache Supabase API calls — NetworkFirst: try network, fall back to cache
            urlPattern: ({ url }) => url.hostname.endsWith(".supabase.co"),
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              networkTimeoutSeconds: 5,
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
});
