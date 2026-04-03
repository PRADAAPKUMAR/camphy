import { memo, useEffect, useRef } from "react";

/**
 * Decorative physics-themed background with orbiting electrons,
 * floating particles, and bouncing line particles.
 * Uses absolute positioning — parent must be `relative`.
 */

const PARTICLE_COUNT = 12;
const SPEED = 3.5; // px per frame (~200px/s at 60fps)

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  opacity: number;
  hue: "primary" | "accent";
  size: number;
  trail: { x: number; y: number }[];
}

function randomAngle() {
  return Math.random() * Math.PI * 2;
}

function spawnParticle(w: number, h: number): Particle {
  const angle = randomAngle();
  const speed = SPEED * (0.7 + Math.random() * 0.6);
  // spawn from a random edge
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
    hue: Math.random() > 0.5 ? "primary" : "accent",
    size: 1.5 + Math.random() * 2,
    trail: [],
  };
}

const PhysicsBackground = memo(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    let particles: Particle[] = [];

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resize();
    window.addEventListener("resize", resize);

    // Init particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(spawnParticle(canvas.width, canvas.height));
    }

    // Stagger spawns with 5Hz frequency (every 200ms = ~12 frames)
    let frameCount = 0;
    const SPAWN_INTERVAL = 12; // frames

    const primaryColor = "rgba(96, 165, 250,"; // blue-ish primary
    const accentColor = "rgba(34, 211, 238,";   // cyan-ish accent

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      frameCount++;

      // Respawn one particle every ~200ms to maintain 5Hz feel
      if (frameCount % SPAWN_INTERVAL === 0 && particles.length < PARTICLE_COUNT + 5) {
        particles.push(spawnParticle(w, h));
      }

      // Remove particles that have been off-screen too long
      particles = particles.filter(p => {
        return p.x >= -50 && p.x <= w + 50 && p.y >= -50 && p.y <= h + 50;
      });

      // Ensure minimum count
      while (particles.length < PARTICLE_COUNT) {
        particles.push(spawnParticle(w, h));
      }

      for (const p of particles) {
        // Store trail
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 8) p.trail.shift();

        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Reflect off walls
        if (p.x <= 0 || p.x >= w) {
          p.vx *= -1;
          p.x = Math.max(0, Math.min(w, p.x));
        }
        if (p.y <= 0 || p.y >= h) {
          p.vy *= -1;
          p.y = Math.max(0, Math.min(h, p.y));
        }

        const color = p.hue === "primary" ? primaryColor : accentColor;

        // Draw trail
        if (p.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(p.trail[0].x, p.trail[0].y);
          for (let i = 1; i < p.trail.length; i++) {
            ctx.lineTo(p.trail[i].x, p.trail[i].y);
          }
          ctx.lineTo(p.x, p.y);
          ctx.strokeStyle = `${color}${p.opacity * 0.3})`;
          ctx.lineWidth = p.size * 0.5;
          ctx.stroke();
        }

        // Draw particle dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${color}${p.opacity})`;
        ctx.fill();

        // Glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
        grad.addColorStop(0, `${color}${p.opacity * 0.4})`);
        grad.addColorStop(1, `${color}0)`);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Radial glow */}
      <div className="absolute inset-0 bg-radial-glow" />

      {/* Orbiting electrons — top-right cluster */}
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

      {/* Orbiting electrons — bottom-left cluster */}
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

      {/* Floating particles */}
      <div className="absolute top-1/4 left-[15%] h-1.5 w-1.5 rounded-full bg-primary/30 animate-[pulse_3s_ease-in-out_infinite]" />
      <div className="absolute top-[60%] right-[20%] h-1 w-1 rounded-full bg-accent/40 animate-[pulse_4s_ease-in-out_infinite_0.5s]" />
      <div className="absolute top-[45%] left-[70%] h-2 w-2 rounded-full bg-primary/20 animate-[pulse_5s_ease-in-out_infinite_1s]" />
      <div className="absolute top-[80%] left-[40%] h-1 w-1 rounded-full bg-accent/25 animate-[pulse_3.5s_ease-in-out_infinite_0.8s]" />
      <div className="absolute top-[15%] right-[35%] h-1.5 w-1.5 rounded-full bg-primary/25 animate-[pulse_4.5s_ease-in-out_infinite_1.2s]" />

      {/* Canvas for bouncing line particles */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
});

PhysicsBackground.displayName = "PhysicsBackground";

export default PhysicsBackground;
