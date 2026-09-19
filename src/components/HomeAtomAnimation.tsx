const HomeAtomAnimation = () => (
  <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
      <div className="absolute -left-[120px] -top-[120px] h-[240px] w-[240px] rounded-full border border-primary/10 motion-safe:animate-[spin_12s_linear_infinite]">
        <div className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-primary/60 shadow-[0_0_12px_hsl(var(--primary)/0.5)]" />
      </div>

      <div className="absolute -left-[180px] -top-[180px] h-[360px] w-[360px] rounded-full border border-accent/10 motion-safe:animate-[spin_18s_linear_infinite_reverse]">
        <div className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-[hsl(var(--study-3)/0.75)] shadow-[0_0_12px_hsl(var(--study-3)/0.5)]" />
      </div>

      <div className="absolute -left-[220px] -top-[220px] h-[440px] w-[440px] rounded-full border border-primary/5 motion-safe:animate-[spin_25s_linear_infinite]">
        <div className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-success/60 shadow-[0_0_12px_hsl(var(--success)/0.5)]" />
      </div>
    </div>
  </div>
);

export default HomeAtomAnimation;