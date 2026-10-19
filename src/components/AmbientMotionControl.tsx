import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setAmbientMotionPaused, useAmbientMotion } from "@/lib/ambient-motion";

export default function AmbientMotionControl() {
  const enabled = useAmbientMotion();
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const label = reduced ? "Background animation disabled by reduced motion" : enabled ? "Pause background animation" : "Resume background animation";
  return <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" aria-label={label} title={label} disabled={reduced}
    onClick={() => setAmbientMotionPaused(enabled)}>
    {enabled ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
  </Button>;
}
