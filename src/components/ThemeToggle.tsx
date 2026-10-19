import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isLight = resolvedTheme === "light";
  const label = `Switch to ${isLight ? "dark" : "light"} theme`;
  return (
    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0" aria-label={label} title={label} onClick={() => setTheme(isLight ? "dark" : "light")}>
      {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </Button>
  );
}
