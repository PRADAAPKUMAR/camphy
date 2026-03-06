import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const usePageTransition = () => {
  const location = useLocation();

  useEffect(() => {
    const main = document.querySelector("main") || document.querySelector("[role='main']") || document.body;
    main.classList.add("page-transition");

    const removeTransition = () => {
      main.classList.remove("page-transition");
    };

    const timer = setTimeout(removeTransition, 500);

    return () => clearTimeout(timer);
  }, [location.pathname]);
};
