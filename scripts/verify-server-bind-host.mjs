import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(path.join(root, "server/server.js"), "utf8");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  /const\s+HOST\s*=\s*process\.env\.HOST\s*\|\|\s*["']0\.0\.0\.0["'];/.test(source),
  "server/server.js must define HOST from process.env.HOST with a 0.0.0.0 fallback",
);

assert(
  /new\s+WebSocketServer\s*\(\s*\{[\s\S]*\bhost:\s*HOST\b/.test(source),
  "server/server.js must pass host: HOST to WebSocketServer",
);

console.log("WebSocket host binding check passed.");
