import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { prefetchRoute } from "@/lib/route-prefetch";

const REDUCED_MOTION = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const FINE_POINTER = () =>
  typeof window !== "undefined" && window.matchMedia?.("(hover: hover) and (pointer: fine)").matches;

/**
 * Plays a GPU-only zoom on the clicked tile. Purely visual: it runs *after*
 * navigation has already been kicked off, never blocks or delays it.
 */
const zoomTile = (el: HTMLElement | null) => {
  if (!el || REDUCED_MOTION() || typeof el.animate !== "function") return;
  el.style.willChange = "transform, opacity";
  const anim = el.animate(
    [
      { transform: "translate3d(0,0,0) scale(1)", opacity: 1 },
      { transform: "translate3d(0,0,0) scale(1.06)", opacity: 0.85 },
    ],
    { duration: 280, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "none" },
  );
  const cleanup = () => {
    el.style.willChange = "";
  };
  anim.finished.then(cleanup).catch(cleanup);
};

/**
 * Tile transition helpers.
 *
 * - `onPointerEnter` prefetches the destination chunk on desktop hover only.
 * - `onClick` starts navigation immediately and animates in parallel, so the
 *   destination route begins loading/rendering while the zoom plays.
 */
export const useTileTransition = () => {
  const navigate = useNavigate();

  /** Props for tiles that navigate imperatively (buttons/divs). */
  const tileProps = useCallback(
    (to: string) => ({
      onPointerEnter: () => {
        if (FINE_POINTER()) prefetchRoute(to);
      },
      onFocus: () => prefetchRoute(to),
      onClick: (e: React.MouseEvent<HTMLElement>) => {
        // Navigate first — the animation is never a gate for routing.
        navigate(to);
        zoomTile(e.currentTarget as HTMLElement);
      },
    }),
    [navigate],
  );

  /** Props for tiles rendered as <Link> — router handles the navigation. */
  const linkTileProps = useCallback(
    (to: string) => ({
      onPointerEnter: () => {
        if (FINE_POINTER()) prefetchRoute(to);
      },
      onFocus: () => prefetchRoute(to),
      onClick: (e: React.MouseEvent<HTMLElement>) => {
        zoomTile(e.currentTarget as HTMLElement);
      },
    }),
    [],
  );

  return { tileProps, linkTileProps, prefetchRoute };
};
