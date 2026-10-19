import { useSyncExternalStore } from "react";

const KEY = "physicshq:ambient-paused";
const EVENT = "physicshq:ambient-motion";
let memoryPaused = false;

export function ambientMotionEnabled() {
  if (typeof window === "undefined") return false;
  let paused = memoryPaused;
  try { const saved = window.localStorage.getItem(KEY); if (saved !== null) paused = saved === "true"; } catch { /* Private storage. */ }
  return !paused && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function subscribe(listener: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  window.addEventListener(EVENT, listener);
  window.addEventListener("storage", listener);
  media.addEventListener("change", listener);
  return () => {
    window.removeEventListener(EVENT, listener);
    window.removeEventListener("storage", listener);
    media.removeEventListener("change", listener);
  };
}

export function useAmbientMotion() {
  return useSyncExternalStore(subscribe, ambientMotionEnabled, () => false);
}

export function setAmbientMotionPaused(paused: boolean) {
  memoryPaused = paused;
  try { window.localStorage.setItem(KEY, String(paused)); } catch { /* Memory fallback. */ }
  window.dispatchEvent(new Event(EVENT));
}
