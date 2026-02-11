import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

// Plugin to serve external brand folder
const serveBrand = () => ({
  name: "serve-brand",
  configureServer(server: ViteDevServer) {
    server.middlewares.use("/brand", (req: IncomingMessage, res: ServerResponse, next: (err?: any) => void) => {
      // Basic static file serving for the brand folder
      const brandPath = path.resolve(__dirname, "../brand");
      let filePath = path.join(brandPath, req.url === "/" ? "index.html" : req.url);

      // Security check to prevent escaping the brand directory (basic)
      if (!filePath.startsWith(brandPath)) {
        res.statusCode = 403;
        res.end("Forbidden");
        return;
      }

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath);
        const mimeTypes: Record<string, string> = {
          ".html": "text/html",
          ".css": "text/css",
          ".js": "application/javascript",
          ".png": "image/png",
          ".jpg": "image/jpeg",
          ".svg": "image/svg+xml",
        };
        const contentType = mimeTypes[ext] || "application/octet-stream";

        res.setHeader("Content-Type", contentType);
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
      } else {
        next();
      }
    });
  },
});

export default defineConfig({
  plugins: [react(), serveBrand()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
    fs: {
      allow: [".."],
    },
  },
  publicDir: "public",
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        brand: path.resolve(__dirname, "../brand/index.html"),
      },
    },
  },
});
