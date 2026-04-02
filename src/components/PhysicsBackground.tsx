import { memo } from "react";

/**
 * Decorative physics-themed background with orbiting electrons,
 * floating particles, and a sine wave. Drop into any page wrapper.
 * Uses absolute positioning — parent must be `relative`.
 */
const PhysicsBackground = memo(() => (
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

    {/* Sine wave at bottom */}
    <svg className="absolute bottom-0 left-0 w-full h-14 opacity-[0.06]" viewBox="0 0 1200 50" preserveAspectRatio="none">
      <path
        d="M0 25 Q 75 0, 150 25 T 300 25 T 450 25 T 600 25 T 750 25 T 900 25 T 1050 25 T 1200 25"
        fill="none"
        stroke="hsl(217 91% 60%)"
        strokeWidth="1.5"
      >
        <animate
          attributeName="d"
          dur="5s"
          repeatCount="indefinite"
          values="M0 25 Q 75 0, 150 25 T 300 25 T 450 25 T 600 25 T 750 25 T 900 25 T 1050 25 T 1200 25;M0 25 Q 75 50, 150 25 T 300 25 T 450 25 T 600 25 T 750 25 T 900 25 T 1050 25 T 1200 25;M0 25 Q 75 0, 150 25 T 300 25 T 450 25 T 600 25 T 750 25 T 900 25 T 1050 25 T 1200 25"
        />
      </path>
    </svg>
  </div>
));

PhysicsBackground.displayName = "PhysicsBackground";

export default PhysicsBackground;
