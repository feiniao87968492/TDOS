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

const requiredFiles = [
  "public/assets/fluid-reveal/B.png",
  "public/assets/fluid-reveal/petal_20241215_012801.mp4",
  "src/experiments/fluid-reveal/index.js",
  "src/effects/fluid-reveal/FluidRevealBackground.js",
  "src/effects/fluid-reveal/FluidSimulation.js",
  "src/effects/fluid-reveal/PointerTracker.js",
  "src/effects/fluid-reveal/presets.js",
  "src/effects/fluid-reveal/shaders/fullscreen.vert",
  "src/effects/fluid-reveal/shaders/advection.frag",
  "src/effects/fluid-reveal/shaders/splat.frag",
  "src/effects/fluid-reveal/shaders/divergence.frag",
  "src/effects/fluid-reveal/shaders/pressure.frag",
  "src/effects/fluid-reveal/shaders/composite.frag",
];

for (const rel of requiredFiles) {
  assert(existsSync(path.join(root, rel)), `Missing required fluid reveal file: ${rel}`);
}

const pkg = JSON.parse(read("package.json"));
assert(pkg.dependencies?.three, "package.json must include three as a runtime dependency");
assert(
  pkg.scripts?.["test:fluid-reveal"] === "node scripts/verify-fluid-reveal.mjs",
  "package.json must expose test:fluid-reveal",
);

const main = read("src/main.js");
assert(main.includes('"/fluid-reveal"'), "src/main.js must register /fluid-reveal route");
assert(
  main.includes('import("./experiments/fluid-reveal/index.js")'),
  "/fluid-reveal must lazy-load the isolated experiment module",
);

const menu = read("src/menu.js");
assert(!menu.includes('href: "/fluid-reveal"'), "Prototype route must not be added to the main menu yet");

const background = read("src/effects/fluid-reveal/FluidRevealBackground.js");
assert(
  background.includes("export function createFluidRevealBackground"),
  "FluidRevealBackground must export createFluidRevealBackground",
);
for (const method of ["mount(", "setTextures(", "setEnabled(", "resize(", "destroy("]) {
  assert(background.includes(method), `FluidRevealBackground API is missing ${method}`);
}
assert(
  background.includes("pointerEvents") && background.includes('"none"'),
  "WebGL canvas must be configured with pointer-events:none",
);
assert(
  background.includes("supportsReducedMotion") &&
    read("src/effects/fluid-reveal/presets.js").includes("prefers-reduced-motion"),
  "Effect must support prefers-reduced-motion",
);
assert(background.includes("visibilitychange"), "Effect must pause/resume for page visibility");

const simulation = read("src/effects/fluid-reveal/FluidSimulation.js");
for (const token of [
  "WebGLRenderTarget",
  "ShaderMaterial",
  "velocity",
  "density",
  "mask",
  "advection",
  "splat",
  "composite",
  "dispose",
]) {
  assert(simulation.includes(token), `FluidSimulation must include ${token}`);
}

const pointer = read("src/effects/fluid-reveal/PointerTracker.js");
for (const token of ["velocity", "speed", "trail", "destroy"]) {
  assert(pointer.includes(token), `PointerTracker must include ${token}`);
}

const experiment = read("src/experiments/fluid-reveal/index.js");
const presets = read("src/effects/fluid-reveal/presets.js");
assert(
  experiment.includes("FLUID_REVEAL_PARAMS"),
  "Experiment route must render controls from FLUID_REVEAL_PARAMS",
);
for (const param of [
  "simulationResolution",
  "particleCount",
  "pointerRadius",
  "splatForce",
  "velocityDissipation",
  "densityDissipation",
  "curlStrength",
  "distortionStrength",
  "revealStrength",
  "backgroundDarkness",
  "particleOpacity",
]) {
  assert(presets.includes(param), `Debug panel missing ${param}`);
}

const styles = read("styles.css");
assert(styles.includes(".fluid-reveal-page"), "styles.css must include fluid reveal page styles");

console.log("Fluid reveal prototype structure check passed.");
