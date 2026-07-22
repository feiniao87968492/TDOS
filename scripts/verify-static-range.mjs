import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const webRoot = mkdtempSync(path.join(tmpdir(), "tdos-static-range-"));
const port = 23100 + Math.floor(Math.random() * 1000);
let child = null;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function waitForServer() {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/`);
      if (response.ok) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
  }
  throw new Error("Static server did not start in time");
}

async function main() {
  mkdirSync(path.join(webRoot, "assets"), { recursive: true });
  writeFileSync(path.join(webRoot, "index.html"), "<!doctype html><title>static range</title>");
  writeFileSync(path.join(webRoot, "assets", "clip.mp4"), Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]));

  child = spawn(process.execPath, [path.join(root, "serve.cjs")], {
    cwd: root,
    env: {
      ...process.env,
      HOST: "127.0.0.1",
      PORT: String(port),
      WEB_ROOT: webRoot,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let serverOutput = "";
  child.stdout.on("data", (chunk) => {
    serverOutput += chunk;
  });
  child.stderr.on("data", (chunk) => {
    serverOutput += chunk;
  });

  await waitForServer();

  const partial = await fetch(`http://127.0.0.1:${port}/assets/clip.mp4`, {
    headers: { Range: "bytes=2-5" },
  });
  const partialBody = new Uint8Array(await partial.arrayBuffer());

  assert(partial.status === 206, `Expected HTTP 206 for byte range, got ${partial.status}. ${serverOutput}`);
  assert(partial.headers.get("content-type") === "video/mp4", "Expected video/mp4 content type for .mp4");
  assert(partial.headers.get("accept-ranges") === "bytes", "Expected Accept-Ranges: bytes");
  assert(partial.headers.get("content-range") === "bytes 2-5/10", "Expected precise Content-Range");
  assert(partial.headers.get("content-length") === "4", "Expected partial Content-Length");
  assert(
    Array.from(partialBody).join(",") === "2,3,4,5",
    `Unexpected partial body: ${Array.from(partialBody).join(",")}`,
  );

  const invalid = await fetch(`http://127.0.0.1:${port}/assets/clip.mp4`, {
    headers: { Range: "bytes=99-100" },
  });
  assert(invalid.status === 416, `Expected HTTP 416 for unsatisfiable range, got ${invalid.status}`);
  assert(invalid.headers.get("content-range") === "bytes */10", "Expected unsatisfied Content-Range");
}

try {
  await main();
  console.log("Static range support check passed.");
} finally {
  child?.kill();
  rmSync(webRoot, { recursive: true, force: true });
}
