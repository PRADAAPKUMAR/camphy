import { useTheme } from "next-themes";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return <AnimatedThemeToggler theme={resolvedTheme === "light" ? "light" : "dark"} onThemeChange={setTheme} />;
}
