import { createFluidRevealBackground } from "../../effects/fluid-reveal/FluidRevealBackground.js";
import {
  DEFAULT_FLUID_REVEAL_OPTIONS,
  FLUID_REVEAL_PARAMS,
  resolveFluidOptions,
} from "../../effects/fluid-reveal/presets.js";

const ASSET_BASE = `${import.meta.env.BASE_URL}assets/fluid-reveal/`;
const MAIN_IMAGE = `${ASSET_BASE}A1.jpeg`;
const REVEAL_IMAGE = `${ASSET_BASE}B.png`;

function formatValue(value) {
  if (Math.abs(value) >= 10) return String(Math.round(value));
  return Number(value).toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

function controlsHTML(options) {
  return FLUID_REVEAL_PARAMS.map((param) => {
    const value = options[param.key] ?? DEFAULT_FLUID_REVEAL_OPTIONS[param.key];
    return `
      <label class="fluid-control" data-param="${param.key}">
        <span class="fluid-control-head">
          <span>${param.label}</span>
          <output>${formatValue(value)}</output>
        </span>
        <input type="range" min="${param.min}" max="${param.max}" step="${param.step}" value="${value}" data-key="${param.key}" />
      </label>
    `;
  }).join("");
}

function template(options) {
  return `
    <section class="fluid-reveal-page">
      <div class="fluid-static-fallback" style="background-image:url('${REVEAL_IMAGE}')" aria-hidden="true"></div>
      <div class="fluid-shell">
        <header class="fluid-topbar">
          <a href="/" class="fluid-back">TDOS</a>
          <div class="fluid-title-block">
            <p class="fluid-kicker">WebGL LAB</p>
            <h1>Fluid Reveal</h1>
          </div>
          <label class="fluid-switch">
            <input id="fluidEnabled" type="checkbox" checked />
            <span>WebGL</span>
          </label>
        </header>

        <main class="fluid-stage-copy">
          <div class="fluid-callout">
            <span>TDOS-EXP-01</span>
            <strong>GPU Fluid Mask</strong>
          </div>
        </main>

        <aside class="fluid-panel" aria-label="Fluid reveal parameters">
          <div class="fluid-panel-head">
            <span>PARAMETERS</span>
            <button id="fluidReset" type="button">Reset</button>
          </div>
          <div class="fluid-controls">
            ${controlsHTML(options)}
          </div>
        </aside>
      </div>
    </section>
  `;
}

export function mount(root) {
  let options = resolveFluidOptions();
  root.innerHTML = template(options);
  const page = root.querySelector(".fluid-reveal-page");
  const enabled = root.querySelector("#fluidEnabled");
  const reset = root.querySelector("#fluidReset");
  const effect = createFluidRevealBackground(options);
  effect.mount(page);
  effect.setTextures(MAIN_IMAGE, REVEAL_IMAGE);

  function syncControl(input) {
    const key = input.dataset.key;
    const value = Number(input.value);
    options = resolveFluidOptions({ ...options, [key]: value });
    const out = input.closest(".fluid-control")?.querySelector("output");
    if (out) out.textContent = formatValue(value);
    effect.setOptions({ [key]: value });
  }

  for (const input of root.querySelectorAll(".fluid-control input")) {
    input.addEventListener("input", () => syncControl(input));
  }

  enabled.addEventListener("change", () => {
    effect.setEnabled(enabled.checked);
    page.classList.toggle("fluid-disabled", !enabled.checked);
  });

  reset.addEventListener("click", () => {
    options = resolveFluidOptions(DEFAULT_FLUID_REVEAL_OPTIONS);
    for (const input of root.querySelectorAll(".fluid-control input")) {
      input.value = options[input.dataset.key];
      syncControl(input);
    }
  });

  return () => {
    effect.destroy();
    root.innerHTML = "";
  };
}
