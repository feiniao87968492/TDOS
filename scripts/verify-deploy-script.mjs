import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const scriptPath = path.join(root, "deploy", "deploy_ecs.ps1");
const readmePath = path.join(root, "deploy", "README.md");
assert(existsSync(scriptPath), "deploy/deploy_ecs.ps1 must exist");
assert(existsSync(readmePath), "deploy/README.md must document the ECS deploy flow");

const script = read("deploy/deploy_ecs.ps1");
const readme = read("deploy/README.md");
for (const forbidden of ["Zty87968492", "password", "Root password"]) {
  assert(!script.includes(forbidden), `Deployment script must not include secret text: ${forbidden}`);
}

for (const token of [
  "arteta",
  "/opt/tdos",
  "118.178.140.171:1314",
  "npm run test:static-range",
  "npm run test:fluid-cover",
  "npm run test:fluid-reveal",
  "npm run test:route-fluid",
  "npm run test:server-bind",
  "npm run test:core",
  "npm run test:2v2-core",
  "npm run test:2v2-server",
  "npm run test:2v2-client",
  "npm run test:2v2-comm",
  "npm run test:2v2-reconnect",
  "npm audit --omit=dev",
  "npm run build",
  "scp.exe",
  "ssh.exe",
  "tdos-web",
  "tdos-ws",
  "pm2",
  "Range: bytes=0-1023",
]) {
  assert(script.includes(token), `Deployment script missing required deploy step/token: ${token}`);
}

for (const token of ["./deploy/deploy_ecs.ps1", "/opt/tdos", "pm2", "206 Partial Content"]) {
  assert(readme.includes(token), `deploy/README.md missing expected deployment note: ${token}`);
}

const pkg = JSON.parse(read("package.json"));
assert(
  pkg.scripts?.["test:deploy-script"] === "node scripts/verify-deploy-script.mjs",
  "package.json must expose test:deploy-script",
);

console.log("Deployment script structure check passed.");
