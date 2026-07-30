import { createServer } from "node:http";
import { readFileSync } from "node:fs";

const PORT = process.env.PORT || 3000;
const distDir = new URL("./dist/server/", import.meta.url);

async function loadServer() {
  const mod = await import(`${distDir}server.js`);
  return mod.default || mod;
}

async function handler(nodeReq, nodeRes) {
  try {
    const server = await loadServer();

    const url = new URL(nodeReq.url || "/", `http://${nodeReq.headers.host || "localhost"}`);
    const headers = new Headers();
    for (let i = 0; i < nodeReq.rawHeaders.length; i += 2) {
      headers.set(nodeReq.rawHeaders[i], nodeReq.rawHeaders[i + 1]);
    }

    const body = nodeReq.method === "GET" || nodeReq.method === "HEAD"
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
          if (done) { nodeRes.end(); return; }
          nodeRes.write(value);
        }
      };
      pump().catch((err) => { console.error(err); nodeRes.end(); });
    } else {
      nodeRes.end();
    }
  } catch (error) {
    console.error(error);
    nodeRes.writeHead(500, { "Content-Type": "text/html" });
    nodeRes.end("<h1>500 Internal Server Error</h1>");
  }
}

const server = createServer(handler);
server.listen(PORT, () => {
  console.log(`Empire Kwa Sultan running on http://localhost:${PORT}`);
});
