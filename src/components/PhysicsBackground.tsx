import { memo, useEffect, useRef } from "react";

const PARTICLE_COUNT = 10;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  opacity: number;
  hue: 0 | 1; // 0=primary, 1=accent
  size: number;
}

function spawnParticle(w: number, h: number): Particle {
  const angle = Math.random() * Math.PI * 2;
  const speed = 1 + Math.random() * 4;
  const edge = Math.floor(Math.random() * 4);
  let x: number, y: number;
  switch (edge) {
    case 0: x = Math.random() * w; y = 0; break;
    case 1: x = w; y = Math.random() * h; break;
    case 2: x = Math.random() * w; y = h; break;
    default: x = 0; y = Math.random() * h; break;
  }
  return {
    x, y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    opacity: 0.25 + Math.random() * 0.35,
    hue: Math.random() > 0.5 ? 0 : 1,
    size: 1.5 + Math.random() * 2,
  };
}

const COLORS = ["rgba(96,165,250,", "rgba(34,211,238,"] as const;

const PhysicsBackground = memo(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let raf = 0;
    let visible = true;
    const particles: Particle[] = [];

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(spawnParticle(canvas.width, canvas.height));
    }

    let frameCount = 0;

    const draw = () => {
      if (!visible) return;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      frameCount++;

      // Spawn every ~15 frames
      if (frameCount % 15 === 0 && particles.length < PARTICLE_COUNT + 3) {
        particles.push(spawnParticle(w, h));
      }

      // Remove off-screen
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        if (p.x < -50 || p.x > w + 50 || p.y < -50 || p.y > h + 50) {
          particles.splice(i, 1);
        }
      }

      // Ensure minimum
      while (particles.length < PARTICLE_COUNT) {
        particles.push(spawnParticle(w, h));
      }

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x <= 0 || p.x >= w) { p.vx *= -1; p.x = Math.max(0, Math.min(w, p.x)); }
        if (p.y <= 0 || p.y >= h) { p.vy *= -1; p.y = Math.max(0, Math.min(h, p.y)); }

        const color = COLORS[p.hue];

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${color}${p.opacity})`;
        ctx.fill();

        // Simplified glow - single gradient
        const r = p.size * 3;
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        grad.addColorStop(0, `${color}${p.opacity * 0.3})`);
        grad.addColorStop(1, `${color}0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    // Pause when tab not visible
    const onVisibility = () => {
      visible = !document.hidden;
      if (visible && !raf) raf = requestAnimationFrame(draw);
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-radial-glow" />

      <div className="absolute -right-20 -top-20 opacity-40">
        <div className="h-[200px] w-[200px] rounded-full border border-primary/15 animate-[spin_14s_linear_infinite]">
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-primary/70 shadow-[0_0_14px_hsl(217_91%_60%/0.5)]" />
        </div>
      </div>
      <div className="absolute -right-32 -top-32 opacity-30">
        <div className="h-[320px] w-[320px] rounded-full border border-accent/10 animate-[spin_22s_linear_infinite_reverse]">
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-accent/60 shadow-[0_0_10px_hsl(199_89%_48%/0.4)]" />
        </div>
      </div>

      <div className="absolute -bottom-16 -left-16 opacity-30">
        <div className="h-[240px] w-[240px] rounded-full border border-primary/10 animate-[spin_18s_linear_infinite]">
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-2.5 w-2.5 rounded-full bg-primary/50 shadow-[0_0_12px_hsl(217_91%_60%/0.4)]" />
        </div>
      </div>
      <div className="absolute -bottom-28 -left-28 opacity-20">
        <div className="h-[380px] w-[380px] rounded-full border border-accent/8 animate-[spin_26s_linear_infinite_reverse]">
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-accent/40 shadow-[0_0_8px_hsl(199_89%_48%/0.3)]" />
        </div>
      </div>

      <div className="absolute top-1/4 left-[15%] h-1.5 w-1.5 rounded-full bg-primary/30 animate-[pulse_3s_ease-in-out_infinite]" />
      <div className="absolute top-[60%] right-[20%] h-1 w-1 rounded-full bg-accent/40 animate-[pulse_4s_ease-in-out_infinite_0.5s]" />
      <div className="absolute top-[45%] left-[70%] h-2 w-2 rounded-full bg-primary/20 animate-[pulse_5s_ease-in-out_infinite_1s]" />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
});

PhysicsBackground.displayName = "PhysicsBackground";

export default PhysicsBackground;
