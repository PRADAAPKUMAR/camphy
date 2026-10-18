import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { prefetchRoute } from "@/lib/route-prefetch";

const FINE_POINTER = () =>
  typeof window !== "undefined" && window.matchMedia?.("(hover: hover) and (pointer: fine)").matches;

/** Route prefetching stays independent of the shared CSS hover treatment. */
export const useTileTransition = () => {
  const navigate = useNavigate();

  /** Props for tiles that navigate imperatively (buttons/divs). */
  const tileProps = useCallback(
    (to: string) => ({
      onPointerEnter: () => {
        if (FINE_POINTER()) prefetchRoute(to);
      },
      onFocus: () => prefetchRoute(to),
      onClick: () => navigate(to),
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
    }),
    [],
  );

  return { tileProps, linkTileProps, prefetchRoute };
};
