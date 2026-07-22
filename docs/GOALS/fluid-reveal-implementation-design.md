# Fluid Reveal Prototype Implementation Design

## Scope

Build an isolated prototype route at `/fluid-reveal`. Do not replace or connect
the existing TDOS main menu background. The route demonstrates a reusable
Three.js WebGL fluid reveal background with a debug control panel.

## Architecture

- `src/effects/fluid-reveal/FluidRevealBackground.js`
  - Public factory: `createFluidRevealBackground(options)`.
  - Public methods: `mount(container)`, `setTextures(mainTexture, revealTexture)`,
    `setEnabled(enabled)`, `resize()`, `destroy()`.
  - Owns DOM canvas, media loading, reduced-motion handling, visibility pause,
    and teardown.
- `src/effects/fluid-reveal/FluidSimulation.js`
  - Owns Three.js renderer, ping-pong render targets, fullscreen passes, and
    composite rendering.
  - Stages: velocity advection, density/mask advection, splat injection,
    divergence, pressure, and final composite.
- `src/effects/fluid-reveal/PointerTracker.js`
  - Tracks pointer position, velocity, direction, and interpolated trail splats.
  - Slow movement produces local soft disturbance; fast movement produces longer
    directional trails.
- `src/effects/fluid-reveal/presets.js`
  - Central defaults and mobile/reduced-motion limits.
- `src/effects/fluid-reveal/shaders/*`
  - GLSL passes for fullscreen quad rendering.
- `src/experiments/fluid-reveal/index.js`
  - Standalone prototype page with foreground UI and parameter panel.
- `public/assets/fluid-reveal/*`
  - Browser-served copies of the goal media from `temp/`.

## Route and UI

`src/main.js` adds a lazy debug route:

```js
"/fluid-reveal": () => import("./experiments/fluid-reveal/index.js")
```

The page places a fixed WebGL canvas behind crisp HTML controls. The canvas uses
`pointer-events:none`; pointer events are tracked from the route container so
foreground buttons, sliders, and text are not distorted or blocked.

## Verification

- `scripts/verify-fluid-reveal.mjs` checks route isolation, public API, shader
  files, debug parameter names, required assets, and that the experiment is not
  added to the main menu.
- Runtime verification will cover desktop 1440x900 rendering, pointer idle,
  slow movement, fast movement, circular movement, stop-decay behavior, resize,
  mobile viewport degradation, console errors, and route teardown.

## Expected Files

- `package.json`
- `package-lock.json`
- `public/assets/fluid-reveal/B.png`
- `public/assets/fluid-reveal/petal_20241215_012801.mp4`
- `scripts/verify-fluid-reveal.mjs`
- `src/main.js`
- `src/experiments/fluid-reveal/index.js`
- `src/effects/fluid-reveal/FluidRevealBackground.js`
- `src/effects/fluid-reveal/FluidSimulation.js`
- `src/effects/fluid-reveal/PointerTracker.js`
- `src/effects/fluid-reveal/presets.js`
- `src/effects/fluid-reveal/shaders/fullscreen.vert`
- `src/effects/fluid-reveal/shaders/advection.frag`
- `src/effects/fluid-reveal/shaders/splat.frag`
- `src/effects/fluid-reveal/shaders/divergence.frag`
- `src/effects/fluid-reveal/shaders/pressure.frag`
- `src/effects/fluid-reveal/shaders/composite.frag`
- `styles.css`
