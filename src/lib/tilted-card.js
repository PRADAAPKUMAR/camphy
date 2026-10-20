/* Hover physics adapted from React Bits TiltedCard (David Haz).
 * Source: https://github.com/DavidHDev/react-bits/blob/main/public/r/TiltedCard-JS-CSS.json
 * License: docs/vendor/reactbits-license.md
 * Local adaptation: existing tile DOM, shared listeners, no flip or device sensors.
 */
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const step = (state, key, target, dt) => {
  const velocity = `v${key}`;
  const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
  const h = dt / steps;
  for (let index = 0; index < steps; index++) {
    state[velocity] += (144 * (target - state[key]) - 21 * state[velocity]) * h;
    state[key] += state[velocity] * h;
  }
  if (Math.abs(target - state[key]) < 0.001 && Math.abs(state[velocity]) < 0.01) {
    state[key] = target;
    state[velocity] = 0;
    return false;
  }
  return true;
};

const properties = ['--tc-rx', '--tc-ry', '--tc-scale', '--tc-glare', '--tc-gx', '--tc-gy', '--tc-px', '--tc-py', '--tc-shadow'];

/** Decorate existing tiles, including tiles mounted later by lazy routes or filters. */
export function installTiltedCards(scope, selector, options) {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = window.matchMedia('(any-hover: hover) and (any-pointer: fine)');
  const contrast = window.matchMedia('(forced-colors: active)');
  const amplitude = clamp(options.rotateAmplitude, 0, 30);
  const scale = clamp(options.scaleOnHover, 1, 1.15);
  const glare = clamp(options.glare, 0, 1);
  const shadow = clamp(options.shadow, 0, 1);
  const states = new Map();
  let active = null;
  let frameId = 0;
  let last = 0;

  const clear = tile => {
    tile.removeAttribute('data-tilted-card');
    for (const property of properties) tile.style.removeProperty(property);
    states.delete(tile);
    if (active === tile) active = null;
  };
  const reset = () => {
    cancelAnimationFrame(frameId);
    frameId = 0;
    last = 0;
    for (const tile of states.keys()) clear(tile);
  };
  const allowed = () => !motion.matches && pointer.matches && !contrast.matches && !document.hidden;
  const frame = now => {
    frameId = 0;
    const dt = clamp((now - last) / 1000 || 1 / 60, 0, 0.05);
    last = now;
    let busy = false;
    for (const [tile, state] of states) {
      if (!tile.isConnected || !allowed()) { clear(tile); continue; }
      let moving = step(state, 'rx', state.inside ? -state.ny * amplitude : 0, dt);
      moving = step(state, 'ry', state.inside ? state.nx * amplitude : 0, dt) || moving;
      moving = step(state, 'lift', state.inside ? 1 : 0, dt) || moving;
      const energy = Math.min(1, Math.hypot(state.rx, state.ry) / Math.max(amplitude, 1));
      tile.style.setProperty('--tc-rx', `${state.rx.toFixed(3)}deg`);
      tile.style.setProperty('--tc-ry', `${state.ry.toFixed(3)}deg`);
      tile.style.setProperty('--tc-scale', (1 + (scale - 1) * state.lift).toFixed(4));
      tile.style.setProperty('--tc-glare', (glare * Math.max(state.lift * 0.5, energy)).toFixed(3));
      tile.style.setProperty('--tc-gx', `${(50 + state.nx * 46).toFixed(2)}%`);
      tile.style.setProperty('--tc-gy', `${(50 + state.ny * 46).toFixed(2)}%`);
      tile.style.setProperty('--tc-px', Math.sin(state.ry * Math.PI / 180).toFixed(4));
      tile.style.setProperty('--tc-py', (-Math.sin(state.rx * Math.PI / 180)).toFixed(4));
      tile.style.setProperty('--tc-shadow', (shadow * state.lift).toFixed(3));
      if (!state.inside && !moving) clear(tile);
      busy = moving || busy;
    }
    if (busy) frameId = requestAnimationFrame(frame);
  };
  const wake = () => {
    if (frameId) return;
    last = performance.now();
    frameId = requestAnimationFrame(frame);
  };
  const leave = () => {
    if (!active) return;
    const state = states.get(active);
    if (state) state.inside = false;
    active = null;
    wake();
  };
  const move = event => {
    if (!allowed() || !['mouse', 'pen'].includes(event.pointerType) || event.buttons) { reset(); return; }
    const target = event.target instanceof Element ? event.target : null;
    const tile = target?.closest(selector);
    if (!tile || !scope.contains(tile) || tile.closest('.glass-focus, [inert], :disabled, [aria-disabled="true"], [data-tilt="off"]')) {
      leave();
      return;
    }
    if (active !== tile) {
      leave();
      // Measure before adding the perspective transform to avoid cursor feedback.
      const bounds = tile.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const state = states.get(tile) ?? { rx: 0, vrx: 0, ry: 0, vry: 0, lift: 0, vlift: 0 };
      Object.assign(state, { bounds, inside: true });
      states.set(tile, state);
      tile.setAttribute('data-tilted-card', '');
      active = tile;
    }
    const state = states.get(tile);
    state.nx = clamp(((event.clientX - state.bounds.left) / state.bounds.width - 0.5) * 2, -1, 1);
    state.ny = clamp(((event.clientY - state.bounds.top) / state.bounds.height - 0.5) * 2, -1, 1);
    wake();
  };
  const out = event => {
    if (active && !(event.relatedTarget instanceof Node && active.contains(event.relatedTarget))) leave();
  };
  const key = event => {
    if (['Tab', 'Enter', ' ', 'Escape'].includes(event.key)) reset();
  };
  // No event cancellation: scrolling, normal links, new tabs and native keys stay native.
  scope.addEventListener('pointerover', move);
  scope.addEventListener('pointermove', move);
  scope.addEventListener('pointerout', out);
  scope.addEventListener('pointerdown', reset, true);
  scope.addEventListener('pointercancel', reset, true);
  document.addEventListener('keydown', key, true);
  document.addEventListener('visibilitychange', reset);
  window.addEventListener('blur', reset);
  window.addEventListener('resize', reset);
  document.addEventListener('scroll', reset, true);
  for (const media of [motion, pointer, contrast]) media.addEventListener('change', reset);

  return () => {
    reset();
    scope.removeEventListener('pointerover', move);
    scope.removeEventListener('pointermove', move);
    scope.removeEventListener('pointerout', out);
    scope.removeEventListener('pointerdown', reset, true);
    scope.removeEventListener('pointercancel', reset, true);
    document.removeEventListener('keydown', key, true);
    document.removeEventListener('visibilitychange', reset);
    window.removeEventListener('blur', reset);
    window.removeEventListener('resize', reset);
    document.removeEventListener('scroll', reset, true);
    for (const media of [motion, pointer, contrast]) media.removeEventListener('change', reset);
  };
}
