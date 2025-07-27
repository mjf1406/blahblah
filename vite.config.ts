/** @format */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
    plugins: [
        react(),
        // The code below enables dev tools like taking screenshots of your site
        // while it is being developed on chef.convex.dev.
        // Feel free to remove this code if you're no longer developing your app with Chef.
        mode === "development"
            ? {
                  name: "inject-chef-dev",
                  transform(code: string, id: string) {
                      if (id.includes("main.tsx")) {
                          return {
                              code: `${code}

/* Added by Vite plugin inject-chef-dev */
window.addEventListener('message', async (message) => {
  if (message.source !== window.parent) return;
  if (message.data.type !== 'chefPreviewRequest') return;

  const worker = await import('https://chef.convex.dev/scripts/worker.bundled.mjs');
  await worker.respondToMessage(message);
});
            `,
                              map: null,
                          };
                      }
                      return null;
                  },
              }
            : null,
        // End of code for taking screenshots on chef.convex.dev.
    ].filter(Boolean),
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    build: {
        // Increase chunk size warning limit
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks: (id) => {
                    // Vendor chunks for better caching
                    if (id.includes("node_modules")) {
                        // React ecosystem
                        if (id.includes("react") || id.includes("react-dom")) {
                            return "react-vendor";
                        }
                        // UI library (Radix UI components)
                        if (id.includes("@radix-ui")) {
                            return "ui-vendor";
                        }
                        // Icons
                        if (id.includes("lucide-react")) {
                            return "icons-vendor";
                        }
                        // Auth related
                        if (
                            id.includes("@convex-dev/auth") ||
                            id.includes("convex")
                        ) {
                            return "convex-vendor";
                        }
                        // Other third-party libraries
                        return "vendor";
                    }

                    // Application chunks
                    if (
                        id.includes("canvas-grid") ||
                        id.includes("CanvasGrid")
                    ) {
                        return "canvas";
                    }

                    if (id.includes("auth") || id.includes("SignIn")) {
                        return "auth";
                    }
                },
            },
        },
    },
}));
