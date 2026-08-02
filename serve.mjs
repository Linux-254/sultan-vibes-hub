import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const PORT = process.env.PORT || 3000;
const clientDir = fileURLToPath(new URL("./dist/client/", import.meta.url));
const serverDir = fileURLToPath(new URL("./dist/server/", import.meta.url));

const MIME_TYPES = {
  ".js": "application/javascript",
  ".css": "text/css",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".json": "application/json",
  ".txt": "text/plain",
  ".webmanifest": "application/manifest+json",
};

async function loadServer() {
  const mod = await import(pathToFileURL(join(serverDir, "server.js")).href);
  return mod.default || mod;
}

async function handler(nodeReq, nodeRes) {
  try {
    const url = new URL(nodeReq.url || "/", `http://${nodeReq.headers.host || "localhost"}`);

    // Serve static files from dist/client/
    if (url.pathname !== "/" && !url.pathname.startsWith("/_")) {
      const filePath = join(
        clientDir,
        url.pathname === "/favicon.png" ? "favicon.png" : url.pathname.replace(/^\//, ""),
      );
      if (existsSync(filePath)) {
        const ext = extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || "application/octet-stream";
        const content = readFileSync(filePath);
        nodeRes.writeHead(200, {
          "Content-Type": contentType,
          "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=31536000, immutable",
        });
        nodeRes.end(content);
        return;
      }
    }

    // Forward to SSR handler
    const server = await loadServer();
    const headers = new Headers();
    for (let i = 0; i < nodeReq.rawHeaders.length; i += 2) {
      headers.set(nodeReq.rawHeaders[i], nodeReq.rawHeaders[i + 1]);
    }

    const body =
      nodeReq.method === "GET" || nodeReq.method === "HEAD"
        ? undefined
        : await new Promise((resolve) => {
            const chunks = [];
            nodeReq.on("data", (c) => chunks.push(c));
            nodeReq.on("end", () => resolve(Buffer.concat(chunks)));
          });

    const request = new Request(url.href, {
      method: nodeReq.method,
      headers,
      body,
    });

    const response = await server.fetch(request, process.env, {});

    nodeRes.writeHead(response.status, Object.fromEntries(response.headers.entries()));
    if (response.body) {
      const reader = response.body.getReader();
      const pump = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            nodeRes.end();
            return;
          }
          nodeRes.write(value);
        }
      };
      pump().catch((err) => {
        console.error(err);
        nodeRes.end();
      });
    } else {
      nodeRes.end();
    }
  } catch (error) {
    console.error(error);
    try {
      nodeRes.writeHead(500, { "Content-Type": "text/html" });
    } catch {}
    nodeRes.end("<h1>500 Internal Server Error</h1>");
  }
}

const server = createServer(handler);
server.listen(PORT, () => {
  console.log(`Empire Kwa Sultan running on http://localhost:${PORT}`);
});
