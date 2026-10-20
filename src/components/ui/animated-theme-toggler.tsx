// Adapted from Magic UI's AnimatedThemeToggler (MIT).
// Source: https://github.com/magicuidesign/magicui/blob/main/apps/www/registry/magicui/animated-theme-toggler.tsx
// License: docs/vendor/magicui-license.md
import { useEffect, useRef, useState, type ComponentPropsWithoutRef } from "react";
import { flushSync } from "react-dom";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import "./animated-theme-toggler.css";

interface AnimatedThemeTogglerProps extends Omit<ComponentPropsWithoutRef<"button">, "onClick" | "children"> {
  theme: "light" | "dark";
  onThemeChange: (theme: "light" | "dark") => void;
  duration?: number;
}

export function AnimatedThemeToggler({ theme, onThemeChange, duration = 400, className, disabled, ...props }: AnimatedThemeTogglerProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const transitionRef = useRef<ViewTransition | null>(null);
  const animationRef = useRef<Animation | null>(null);
  const mountedRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const nextTheme = theme === "dark" ? "light" : "dark";
  const label = `Switch to ${nextTheme} theme`;

  useEffect(() => {
    mountedRef.current = true;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const contrast = window.matchMedia("(forced-colors: active)");
    const skip = () => { if (motion.matches || contrast.matches) transitionRef.current?.skipTransition(); };
    motion.addEventListener("change", skip);
    contrast.addEventListener("change", skip);
    return () => {
      mountedRef.current = false;
      motion.removeEventListener("change", skip);
      contrast.removeEventListener("change", skip);
      if (!transitionRef.current) return;
      transitionRef.current.skipTransition();
      transitionRef.current = null;
      animationRef.current?.cancel();
      animationRef.current = null;
      const root = document.documentElement;
      delete root.dataset.magicuiThemeVt;
      root.style.removeProperty("--magicui-theme-toggle-vt-duration");
      root.style.removeProperty("--magicui-theme-vt-clip-from");
    };
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    const button = buttonRef.current;
    if (!button || transitionRef.current || root.dataset.magicuiThemeVt === "active") return;
    let applied = false;
    const applyTheme = () => {
      if (applied) return;
      applied = true;
      // Update both app theme classes before the new snapshot is captured.
      root.classList.remove("light", "dark");
      root.classList.add(nextTheme);
      root.style.colorScheme = nextTheme;
      // next-themes owns persistence and keeps every theme consumer in sync.
      onThemeChange(nextTheme);
    };
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const contrast = window.matchMedia("(forced-colors: active)").matches;
    const animationDuration = Math.max(0, Math.min(duration, 2000));
    if (reduced || contrast || !animationDuration || typeof document.startViewTransition !== "function" || typeof root.animate !== "function") {
      applyTheme();
      return;
    }

    const { left, top, width, height } = button.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const radius = Math.hypot(Math.max(x, viewportWidth - x), Math.max(y, viewportHeight - y));
    // Percentage coordinates also work at fractional display scaling.
    const point = `${x / viewportWidth * 100}% ${y / viewportHeight * 100}%`;
    const radiusPercent = radius / (Math.hypot(viewportWidth, viewportHeight) / Math.SQRT2) * 100;
    const clipPath = [`circle(0% at ${point})`, `circle(${radiusPercent}% at ${point})`];
    root.dataset.magicuiThemeVt = "active";
    root.style.setProperty("--magicui-theme-toggle-vt-duration", `${animationDuration}ms`);
    root.style.setProperty("--magicui-theme-vt-clip-from", clipPath[0]);
    setBusy(true);

    const cleanup = () => {
      transitionRef.current = null;
      animationRef.current?.cancel();
      animationRef.current = null;
      delete root.dataset.magicuiThemeVt;
      root.style.removeProperty("--magicui-theme-toggle-vt-duration");
      root.style.removeProperty("--magicui-theme-vt-clip-from");
      if (mountedRef.current) setBusy(false);
    };
    try {
      const transition = document.startViewTransition(() => flushSync(applyTheme));
      transitionRef.current = transition;
      const finish = () => { if (transitionRef.current === transition) cleanup(); };
      // A skipped/unsupported animation must still leave a working theme switch.
      void transition.finished.then(finish, finish);
      void transition.ready.then(() => {
        if (transitionRef.current !== transition) return;
        animationRef.current = root.animate({ clipPath }, {
          duration: animationDuration,
          easing: "ease-in-out",
          fill: "forwards",
          pseudoElement: "::view-transition-new(root)",
        });
      }).catch(() => transition.skipTransition());
    } catch {
      cleanup();
      applyTheme();
    }
  };

  return <Button
    {...props}
    ref={buttonRef}
    type="button"
    variant="ghost"
    size="icon"
    className={cn("h-11 w-11 shrink-0", className)}
    aria-label={label}
    title={label}
    aria-busy={busy || undefined}
    disabled={disabled || busy}
    onClick={toggleTheme}
  >
    {theme === "dark" ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
  </Button>;
}
