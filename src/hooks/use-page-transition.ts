import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * Purely visual page reveal. The route is already rendering when this runs, so
 * the animation never gates navigation.
 * - PUSH/REPLACE: zoom-in reveal (continues the clicked tile's zoom).
 * - POP (browser/in-app back): reverse zoom-out reveal.
 */
export const usePageTransition = () => {
  const location = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    const main =
      document.querySelector("main") || document.querySelector("[role='main']") || document.body;
    const cls = navType === "POP" ? "page-transition-back" : "page-transition";
    main.classList.add(cls);

    const timer = setTimeout(() => main.classList.remove(cls), 320);

    return () => {
      clearTimeout(timer);
      main.classList.remove(cls);
    };
  }, [location.pathname, navType]);
};
