import { useEffect, useRef } from "react";
import { useAmbientMotion } from "@/lib/ambient-motion";
import { createParticle, stepParticle } from "@/lib/particles";

/** One viewport canvas, below all content and glass tiles. */
export default function PhysicsParticles() {
  const ref = useRef<HTMLCanvasElement>(null);
  const enabled = useAmbientMotion();
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !enabled) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let width = innerWidth, height = innerHeight, last = 0, frame = 0;
    const particles = Array.from({ length: width < 640 ? 18 : 30 }, () => createParticle(width, height));
    const resize = () => {
      width = innerWidth; height = innerHeight;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const draw = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, .05) : 0;
      last = now;
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        stepParticle(p, dt, width, height);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.shadowColor = `hsl(${p.hue} 100% 75%)`; ctx.shadowBlur = 9;
        ctx.fillStyle = `hsl(${p.hue} 100% 90%)`; ctx.fill();
      }
      frame = requestAnimationFrame(draw);
    };
    const visibility = () => {
      cancelAnimationFrame(frame); last = 0;
      if (!document.hidden) frame = requestAnimationFrame(draw);
    };
    resize(); visibility();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", visibility);
      ctx.clearRect(0, 0, width, height);
    };
  }, [enabled]);
  return <canvas ref={ref} className="physics-particles" aria-hidden="true" />;
}
