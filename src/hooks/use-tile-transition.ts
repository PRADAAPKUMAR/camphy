import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { prefetchRoute } from "@/lib/route-prefetch";

const FINE_POINTER = () =>
  typeof window !== "undefined" && window.matchMedia?.("(hover: hover) and (pointer: fine)").matches;

/**
 * Tile transition helpers.
 *
 * - `onPointerEnter` prefetches the destination chunk on desktop hover only.
 * - `onClick` starts navigation immediately; the shared shell animates in parallel, so the
 *   destination route begins loading/rendering during the fullscreen expansion.
 */
export const useTileTransition = () => {
  const navigate = useNavigate();

  /** Props for tiles that navigate imperatively (buttons/divs). */
  const tileProps = useCallback(
    (to: string) => ({
      "data-tile-to": to,
      onPointerEnter: () => {
        if (FINE_POINTER()) prefetchRoute(to);
      },
      onFocus: () => prefetchRoute(to),
      onClick: () => {
        // The document capture listener has already recorded this tile.
        navigate(to);
      },
    }),
    [navigate],
  );

  /** Props for tiles rendered as <Link> — router handles the navigation. */
  const linkTileProps = useCallback(
    (to: string) => ({
      "data-tile-to": to,
      onPointerEnter: () => {
        if (FINE_POINTER()) prefetchRoute(to);
      },
      onFocus: () => prefetchRoute(to),
    }),
    [],
  );

  return { tileProps, linkTileProps, prefetchRoute };
};
