import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { clampPointerSplatRadius, resolvePointerSplatRadius } = await import(
  "../src/effects/fluid-reveal/pointerRadius.js"
);

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

for (const rel of [
  "public/assets/fluid-reveal/A1.jpeg",
  "public/assets/fluid-reveal/B.png",
  "public/assets/fluid-reveal/petal_20241215_012801.mp4",
  "src/effects/fluid-reveal/FluidRevealBackground.js",
]) {
  assert(existsSync(path.join(root, rel)), `Missing cover fluid asset or module: ${rel}`);
}

const pkg = JSON.parse(read("package.json"));
assert(
  pkg.scripts?.["test:fluid-cover"] === "node scripts/verify-fluid-cover.mjs",
  "package.json must expose test:fluid-cover",
);

const menu = read("src/menu.js");
assert(
  menu.includes('import("./effects/fluid-reveal/FluidRevealBackground.js")'),
  "Main menu must dynamically import the accepted fluid reveal background module",
);
assert(
  menu.includes("assets/fluid-reveal/") &&
    menu.includes("A1.jpeg") &&
    menu.includes("B.png"),
  "Main menu must wire the accepted cover still image and reveal image assets",
);
assert(
  menu.includes("createFluidRevealBackground(FLUID_COVER_OPTIONS)"),
  "Main menu must create the fluid cover with cover-specific options",
);
for (const token of [
  "maxFps: 24",
  "simulationResolution: 112",
  "particleCount: 72",
  "pointerRadius: 0.91",
  "splatForce: 0.91",
  "cursorRing: true",
  "clickSplatForce",
  "pressureIterations: 3",
  "dprCap: 1",
]) {
  assert(menu.includes(token), `Fluid cover options must include expected production setting: ${token}`);
}
assert(
  menu.includes("fluidCover.mount(stage)") &&
    menu.includes("fluidCover.setTextures(FLUID_COVER_MAIN_IMAGE_URL, FLUID_COVER_IMAGE_URL)"),
  "Main menu must mount the fluid effect into the title stage and set both textures",
);
assert(
  menu.includes("const starfieldAc = new AbortController()") &&
    menu.includes("startStarfield(bg, starfieldAc.signal)") &&
    menu.includes("starfieldAc.abort()"),
  "Main menu must stop the starfield fallback after the fluid cover mounts",
);
assert(
  menu.includes("fluidCover?.destroy()") && menu.includes("ac.abort()"),
  "Main menu teardown must destroy the fluid effect and abort existing listeners",
);
assert(
  !menu.includes('href: "/fluid-reveal"'),
  "Standalone prototype route must stay out of the main menu",
);
assert(!menu.includes("ts-hero-img"), "Main menu must not render the foreground seven-character hero canvas");
assert(!menu.includes("assets/portraits/"), "Main menu must not load foreground portrait assets");

const styles = read("styles.css");
assert(
  styles.includes(".ts-fluid-cover .fluid-reveal-canvas"),
  "styles.css must include title-screen fluid cover layering",
);
assert(
  styles.includes(".ts-fluid-cover .ts-bg"),
  "styles.css must keep the existing starfield as the fallback layer",
);
assert(styles.includes(".fluid-pointer-ring"), "styles.css must style the custom pointer ring");
assert(styles.includes("0.8cm"), "Pointer ring must use a 0.8cm physical diameter");
assert(
  styles.includes("@keyframes fluid-pointer-ring-pulse") &&
    styles.includes(".fluid-pointer-ring.is-pulsing"),
  "Pointer ring must animate outward and contract on click",
);
assert(styles.includes("0.8s"), "Pointer ring pulse animation must run for 0.8s");

const background = read("src/effects/fluid-reveal/FluidRevealBackground.js");
assert(
  background.includes("pointerEvents") && background.includes('"none"'),
  "Fluid cover canvas must not capture menu input",
);
assert(
  background.includes("maxFps") && background.includes("frameInterval"),
  "Fluid background must support maxFps throttling for the production cover",
);
assert(
  background.includes("fluid-pointer-ring") &&
    background.includes("is-pulsing") &&
    background.includes("pointerdown") &&
    background.includes("clearTimeout") &&
    background.includes("}, 800)"),
  "Fluid background must mount and clean up a pulsing pointer ring",
);
assert(
  background.includes("isStaticImageUrl") &&
    background.includes("TextureLoader") &&
    background.includes("mainAspect: textureAspectFromImage(texture.image)") &&
    background.includes("VideoTexture"),
  "Fluid background must support both static image and video main textures",
);

const experiment = read("src/experiments/fluid-reveal/index.js");
assert(
  experiment.includes("A1.jpeg") &&
    experiment.includes("effect.setTextures(MAIN_IMAGE, REVEAL_IMAGE)"),
  "Standalone fluid reveal prototype must use the same A1 still image as its main texture",
);

const pointer = read("src/effects/fluid-reveal/PointerTracker.js");
assert(
  pointer.includes("handlePointerDown") &&
    pointer.includes("clickSplatForce") &&
    pointer.includes("clickRadiusMultiplier"),
  "PointerTracker must add a stronger click splat for the cover interaction",
);
assert(
  Math.abs(resolvePointerSplatRadius(0.91) - 0.0819) < 0.000001,
  "Cover pointerRadius 0.91 must resolve to a local shader radius near 0.082",
);
assert(
  resolvePointerSplatRadius(0.16) === 0.16,
  "Prototype pointerRadius values in the original control range must remain direct radii",
);
assert(
  resolvePointerSplatRadius(1.8) <= 0.16,
  "Large pointerRadius scale values must be capped before reaching the shader",
);
assert(
  clampPointerSplatRadius(0.304) === 0.16,
  "Already resolved splat radii must clamp at the shader limit instead of being scaled again",
);

console.log("Fluid cover integration structure check passed.");
