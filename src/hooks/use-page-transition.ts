import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { animateTileNavigation, installTileNavigation, type RoutePosition } from "@/lib/tile-navigation";

/** Record the clicked tile before routing; animate the live next page after commit. */
export const usePageTransition = () => {
  const location = useLocation();
  const navType = useNavigationType();
  const current = useRef<RoutePosition>({ key: location.key, path: location.pathname + location.search + location.hash });

  useEffect(() => installTileNavigation(() => current.current), []);
  useLayoutEffect(() => {
    const next = { key: location.key, path: location.pathname + location.search + location.hash };
    const previous = current.current;
    current.current = next;
    if (previous.key === next.key) return;
    if (animateTileNavigation(previous, next)) return;
    const main = document.getElementById("page-content");
    if (!main) return;
    const cls = navType === "POP" ? "page-transition-back" : "page-transition";
    main.classList.add(cls);
    const timer = window.setTimeout(() => main.classList.remove(cls), 320);
    return () => { clearTimeout(timer); main.classList.remove(cls); };
  }, [location.key, location.pathname, location.search, location.hash, navType]);
};
