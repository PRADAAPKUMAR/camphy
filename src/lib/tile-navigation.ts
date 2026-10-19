/** Visual navigation only: routing and lazy module loading never wait for animation. */
export interface RoutePosition { key: string; path: string }
interface Box { left: number; top: number; width: number; height: number; radius: string }
interface TileOrigin {
  parent: RoutePosition;
  destination: string;
  label: string;
  box: Box;
  scroll: number;
}
interface Capture {
  from: RoutePosition;
  snapshot: HTMLElement;
  tile?: HTMLElement;
  origin?: TileOrigin;
}

const TILE = ".grade-tile, .glass-card-hover, [data-tile-to]";
const DURATION = 520;
const EASING = "cubic-bezier(.22, 1, .36, 1)";
const origins = new Map<string, TileOrigin>();
let pending: Capture | undefined;
let expiry = 0;
let stop: (() => void) | undefined;
let captureHistory: (() => void) | undefined;
// Subscribe before BrowserRouter mounts: its popstate listener can commit React
// synchronously, so a later listener would see the new page instead of the old one.
const beforeHistoryNavigation = () => captureHistory?.();
if (typeof window !== "undefined") window.addEventListener("popstate", beforeHistoryNavigation, true);
if (import.meta.hot) import.meta.hot.dispose(() => window.removeEventListener("popstate", beforeHistoryNavigation, true));

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const label = (tile: HTMLElement) => tile.textContent?.replace(/\s+/g, " ").trim() ?? "";
const box = (tile: HTMLElement): Box => {
  const rect = tile.getBoundingClientRect();
  return { left: rect.left, top: rect.top, width: rect.width, height: rect.height, radius: getComputedStyle(tile).borderRadius };
};

function sanitize(copy: HTMLElement) {
  copy.inert = true;
  copy.setAttribute("aria-hidden", "true");
  // Snapshot copies must never introduce duplicate IDs or initiate document loads.
  for (const el of [copy, ...copy.querySelectorAll<HTMLElement>("*")]) {
    if (el.id === "page-content") el.classList.add("snapshot-page-content");
    el.removeAttribute("id");
    if (el instanceof HTMLIFrameElement) {
      const placeholder = document.createElement("div");
      placeholder.className = el.className;
      placeholder.style.cssText = el.style.cssText;
      el.replaceWith(placeholder);
    }
  }
  return copy;
}

function snapshot(app: HTMLElement) {
  const frame = document.createElement("div");
  frame.className = "tile-route-snapshot";
  frame.style.background = getComputedStyle(document.body).background;
  frame.inert = true;
  frame.setAttribute("aria-hidden", "true");
  const copy = sanitize(app.cloneNode(true) as HTMLElement);
  copy.style.cssText = `position:relative;width:${app.clientWidth}px;transform:translate(${-scrollX}px,${-scrollY}px);margin:0;clip-path:none;opacity:1;z-index:auto`;
  frame.append(copy);
  return frame;
}

function cancel() {
  stop?.();
  stop = undefined;
  clearTimeout(expiry);
  pending = undefined;
}

/** Capture before the router replaces the old DOM, including browser Back/Forward. */
export function installTileNavigation(getRoute: () => RoutePosition) {
  const capture = (tile?: HTMLElement) => {
    cancel();
    if (reduced() || typeof Element.prototype.animate !== "function") return;
    const app = document.querySelector<HTMLElement>(".glass-app");
    if (!app) return;
    const from = getRoute();
    const origin = tile ? { parent: from, destination: "", label: label(tile), box: box(tile), scroll: scrollY } : undefined;
    const copy = tile ? sanitize(tile.cloneNode(true) as HTMLElement) : undefined;
    if (copy && tile) {
      // A dashboard tile inherits grade variables from a parent that won't travel with it.
      const style = getComputedStyle(tile);
      for (const prop of ["--grade-accent", "--grade-accent-subtle", "--grade-accent-border", "--grade-foreground", "--grade-glow"]) {
        copy.style.setProperty(prop, style.getPropertyValue(prop));
      }
    }
    pending = { from, snapshot: snapshot(app), tile: copy, origin };
    expiry = window.setTimeout(() => { pending = undefined; }, 1000);
  };
  const click = (event: MouseEvent) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = event.target instanceof Element ? event.target : null;
    const tile = target?.closest<HTMLElement>(TILE);
    const anchor = target?.closest<HTMLAnchorElement>("a");
    if (anchor && (anchor.target && anchor.target !== "_self" || anchor.hasAttribute("download") || anchor.origin !== location.origin)) return;
    if (tile && !tile.closest('[aria-disabled="true"], :disabled')) capture(tile);
    else {
      const origin = origins.get(getRoute().key);
      const button = target?.closest("button");
      if (origin && (anchor?.pathname === origin.parent.path.split(/[?#]/)[0] || button && /back|home|all grades/i.test(button.textContent ?? ""))) capture();
      else cancel();
    }
  };
  captureHistory = () => capture();
  const interrupt = () => cancel();
  const visibility = () => { if (document.hidden) cancel(); };
  const key = (event: KeyboardEvent) => { if (event.key === "Escape") cancel(); };
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  document.addEventListener("click", click, true);
  window.addEventListener("resize", interrupt);
  window.addEventListener("wheel", interrupt, { passive: true });
  document.addEventListener("keydown", key);
  document.addEventListener("visibilitychange", visibility);
  media.addEventListener("change", interrupt);
  return () => {
    document.removeEventListener("click", click, true);
    captureHistory = undefined;
    window.removeEventListener("resize", interrupt);
    window.removeEventListener("wheel", interrupt);
    document.removeEventListener("keydown", key);
    document.removeEventListener("visibilitychange", visibility);
    media.removeEventListener("change", interrupt);
    cancel();
  };
}

function findTile(origin: TileOrigin) {
  const tiles = Array.from(document.querySelector<HTMLElement>(".glass-app")?.querySelectorAll<HTMLElement>(TILE) ?? []);
  return tiles.find(tile => tile.dataset.tileTo === origin.destination || tile instanceof HTMLAnchorElement && tile.pathname + tile.search + tile.hash === origin.destination)
    ?? tiles.find(tile => label(tile) === origin.label);
}

function inset(rect: Box) {
  const app = document.querySelector<HTMLElement>(".glass-app")!;
  const parent = app.getBoundingClientRect();
  return `inset(${rect.top - parent.top}px calc(100% - ${rect.left + rect.width - parent.left}px) calc(100% - ${rect.top + rect.height - parent.top}px) ${rect.left - parent.left}px round ${rect.radius})`;
}

function finishAnimation(app: HTMLElement, overlays: HTMLElement[], animations: Animation[]) {
  let ended = false;
  const oldZ = app.style.zIndex, oldClip = app.style.clipPath;
  document.documentElement.dataset.tileTransition = "active";
  const cleanup = () => {
    if (ended) return;
    ended = true;
    animations.forEach(animation => animation.cancel());
    overlays.forEach(overlay => overlay.remove());
    app.style.zIndex = oldZ;
    app.style.clipPath = oldClip;
    delete document.documentElement.dataset.tileTransition;
  };
  stop = cleanup;
  return cleanup;
}

function expand(capture: Capture, app: HTMLElement) {
  const origin = capture.origin!;
  window.scrollTo({ top: 0, behavior: "instant" });
  const frame = capture.snapshot;
  const panel = document.createElement("div");
  panel.className = "tile-route-panel";
  panel.inert = true;
  panel.setAttribute("aria-hidden", "true");
  if (capture.tile) panel.append(capture.tile);
  document.body.append(frame, panel);
  const animations: Animation[] = [];
  const done = finishAnimation(app, [frame, panel], animations);
  app.style.zIndex = "2";
  const start = origin.box;
  const end = { left: 0, top: 0, width: innerWidth, height: innerHeight, radius: "0px" };
  animations.push(panel.animate([
    { left: `${start.left}px`, top: `${start.top}px`, width: `${start.width}px`, height: `${start.height}px`, borderRadius: start.radius },
    { left: "0px", top: "0px", width: `${innerWidth}px`, height: `${innerHeight}px`, borderRadius: "0px" },
  ], { duration: DURATION, easing: EASING, fill: "both" }));
  if (capture.tile) animations.push(capture.tile.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: "forwards" }));
  const reveal = app.animate([
    { clipPath: inset(start) }, { clipPath: inset(end) },
  ], { duration: DURATION, easing: EASING, fill: "both" });
  animations.push(reveal, app.animate([
    { opacity: 0, offset: 0 }, { opacity: 0, offset: .28 },
    { opacity: 1, offset: .85 }, { opacity: 1, offset: 1 },
  ], { duration: DURATION, fill: "both" }));
  reveal.finished.then(done, done);
}

function collapse(capture: Capture, origin: TileOrigin, app: HTMLElement) {
  const frame = capture.snapshot;
  frame.dataset.direction = "back";
  document.body.append(frame);
  const animations: Animation[] = [];
  const done = finishAnimation(app, [frame], animations);
  let observer: MutationObserver | undefined;
  let timer = 0;
  const cleanup = () => { observer?.disconnect(); clearTimeout(timer); done(); };
  stop = cleanup;
  const run = (tile?: HTMLElement) => {
    observer?.disconnect(); clearTimeout(timer);
    window.scrollTo({ top: origin.scroll, behavior: "instant" });
    const rect = tile ? box(tile) : origin.box;
    const width = innerWidth, height = innerHeight;
    const animation = frame.animate([
      { transform: "translate(0,0) scale(1,1)", borderRadius: "0px", opacity: 1, offset: 0 },
      { transform: `translate(${rect.left}px,${rect.top}px) scale(${rect.width / width},${rect.height / height})`, borderRadius: rect.radius, opacity: .9, offset: .8 },
      { transform: `translate(${rect.left}px,${rect.top}px) scale(${rect.width / width},${rect.height / height})`, borderRadius: rect.radius, opacity: 0, offset: 1 },
    ], { duration: DURATION, easing: EASING, fill: "both" });
    animations.push(animation);
    animation.finished.then(() => {
      cleanup();
      if (tile && (document.activeElement === document.body || document.activeElement?.id === "page-content")) tile.focus({ preventScroll: true });
    }, cleanup);
  };
  const tile = findTile(origin);
  if (tile) run(tile);
  else {
    // A lazy parent can mount while routing proceeds underneath the old view.
    observer = new MutationObserver(() => { const tile = findTile(origin); if (tile) run(tile); });
    observer.observe(app, { childList: true, subtree: true });
    timer = window.setTimeout(() => run(), 800);
  }
}

/** Called in the route's layout effect, before the new page is painted. */
export function animateTileNavigation(previous: RoutePosition, next: RoutePosition) {
  const capture = pending;
  clearTimeout(expiry); pending = undefined;
  stop?.(); stop = undefined;
  if (!capture || capture.from.key !== previous.key || reduced()) return false;
  const app = document.querySelector<HTMLElement>(".glass-app");
  if (!app) return false;
  const origin = origins.get(previous.key);
  if (origin?.parent.path === next.path) {
    const inherited = origins.get(origin.parent.key);
    if (inherited) origins.set(next.key, inherited);
    collapse(capture, origin, app);
    return true;
  }
  if (capture.origin) {
    if (document.activeElement === document.body) document.getElementById("page-content")?.focus({ preventScroll: true });
    origins.set(next.key, { ...capture.origin, destination: next.path });
    if (origins.size > 80) origins.delete(origins.keys().next().value!);
    expand(capture, app);
    return true;
  }
  // Browser Forward can replay a previously recorded tile expansion.
  const replay = origins.get(next.key);
  if (replay?.parent.path === previous.path) {
    expand({ ...capture, origin: { ...replay, box: findTile(replay) ? box(findTile(replay)!) : replay.box } }, app);
    return true;
  }
  return false;
}
