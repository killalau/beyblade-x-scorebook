import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";

const port = 4173;
const mountPath = "/beyblade-x-scorebook/";
const distRoot = resolve(new URL("../dist", import.meta.url).pathname);
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

const server = createServer(async (request, response) => {
  try {
    const requestPath = decodeURIComponent(
      new URL(request.url ?? "/", "http://localhost").pathname,
    );
    if (!requestPath.startsWith(mountPath))
      return send(response, 404, "Not found");
    const relativePath = requestPath.slice(mountPath.length) || "react.html";
    const filePath = resolve(distRoot, relativePath);
    if (filePath !== distRoot && !filePath.startsWith(`${distRoot}${sep}`)) {
      return send(response, 403, "Forbidden");
    }
    if (!(await stat(filePath)).isFile())
      return send(response, 404, "Not found");
    response.writeHead(200, {
      "Content-Type":
        contentTypes[extname(filePath)] ?? "application/octet-stream",
      "Cache-Control": "no-store",
    });
    response.end(await readFile(filePath));
  } catch {
    send(response, 404, "Not found");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(
    `React production build available at http://127.0.0.1:${port}${mountPath}`,
  );
});

function send(response, status, body) {
  response.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  response.end(body);
}
