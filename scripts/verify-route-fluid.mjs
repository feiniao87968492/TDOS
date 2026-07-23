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

const helperPath = "src/effects/fluid-reveal/routeBackdrop.js";
assert(existsSync(path.join(root, helperPath)), "Route fluid backdrop helper must exist");

const pkg = JSON.parse(read("package.json"));
assert(
  pkg.scripts?.["test:route-fluid"] === "node scripts/verify-route-fluid.mjs",
  "package.json must expose test:route-fluid",
);

const helper = read(helperPath);
for (const token of [
  "mountRouteFluidBackdrop",
  'import("./FluidRevealBackground.js")',
  "A1.jpeg",
  "B.png",
  "cursorRing",
  "onReady",
  "destroy()",
  "route-fluid-backdrop",
]) {
  assert(helper.includes(token), `Route fluid backdrop helper missing expected token: ${token}`);
}
assert(
  !helper.includes('from "./FluidRevealBackground.js"'),
  "Route fluid backdrop helper must lazy-load FluidRevealBackground",
);

const menu = read("src/menu.js");
assert(menu.includes("mountRouteFluidBackdrop"), "Home route must use the shared fluid backdrop helper");
assert(
  !menu.includes("createFluidRevealBackground(FLUID_COVER_OPTIONS)"),
  "Home route must not keep a duplicate direct fluid mounting flow",
);

for (const rel of ["src/profile-view.js", "src/guide.js", "src/credits.js"]) {
  const source = read(rel);
  assert(source.includes("mountRouteFluidBackdrop"), `${rel} must mount the shared route fluid backdrop`);
  assert(source.includes("startStarfield"), `${rel} must preserve starfield fallback setup`);
  assert(!source.includes("cursorRing: false"), `${rel} must keep the default pointer ring behavior`);
}

const solo = read("src/solo.js");
assert(solo.includes("mountRouteFluidBackdrop"), "Solo battle route must mount the shared route fluid backdrop");
assert(solo.includes("cursorRing: false"), "Solo battle route must disable the pointer ring");

const characterSelect = read("src/character-select.js");
assert(
  characterSelect.includes("mountRouteFluidBackdrop") &&
    characterSelect.includes("Character select fluid backdrop"),
  "Character select screens in /play and /online must use the shared route fluid backdrop",
);

const online = read("src/online.js");
assert(online.includes("mountRouteFluidBackdrop"), "Online route must mount the shared route fluid backdrop");
assert(
  online.includes("syncOnlineFluidBackdrop") &&
    online.includes("setRoomHudVisible") &&
    online.includes("ui.lobbyView") &&
    online.includes("ui.battleView") &&
    online.includes("cursorRing: false"),
  "Online route must manage lobby full effect and battle background-only effect",
);

assert(
  !read("src/debug.js").includes("mountRouteFluidBackdrop"),
  "Debug route must remain outside the production route fluid rollout",
);
assert(
  !read("src/experiments/fluid-reveal/index.js").includes("mountRouteFluidBackdrop"),
  "Standalone fluid reveal prototype must not double-mount the shared route backdrop",
);

const styles = read("styles.css");
for (const token of [
  ".route-fluid-backdrop",
  ".cs-screen.route-fluid-backdrop",
  ".route-fluid-backdrop .fluid-reveal-canvas",
  ".route-fluid-backdrop > :not(.fluid-reveal-canvas)",
  ".route-fluid-backdrop.route-fluid-no-ring .fluid-pointer-ring",
]) {
  assert(styles.includes(token), `styles.css missing route fluid layering token: ${token}`);
}

const deploy = read("deploy/deploy_ecs.ps1");
assert(deploy.includes("npm run test:route-fluid"), "Deploy script must run test:route-fluid");

console.log("Route fluid backdrop integration check passed.");
