const orbits = [
  {
    rotation: "rotate-[8deg]",
    plane: "inset-[5%] scale-y-[0.38] border-primary/20",
    motion: "motion-safe:animate-[spin_8s_linear_infinite]",
    electron: "bg-primary shadow-[0_0_14px_hsl(var(--primary)/0.7)] scale-y-[2.63]",
  },
  {
    rotation: "rotate-[66deg]",
    plane: "inset-[10%] scale-y-[0.48] border-accent/20",
    motion: "motion-safe:animate-[spin_11s_linear_infinite_reverse]",
    electron: "bg-accent shadow-[0_0_14px_hsl(var(--accent)/0.7)] scale-y-[2.08]",
  },
  {
    rotation: "-rotate-[55deg]",
    plane: "inset-[16%] scale-y-[0.58] border-success/20",
    motion: "motion-safe:animate-[spin_14s_linear_infinite]",
    electron: "bg-success shadow-[0_0_14px_hsl(var(--success)/0.7)] scale-y-[1.72]",
  },
] as const;

const HomeAtomAnimation = () => (
  <div
    className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 opacity-50 sm:h-80 sm:w-80"
    aria-hidden="true"
  >
    <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/40 shadow-[0_0_22px_hsl(217_91%_60%/0.45)]" />
    {orbits.map((orbit) => (
      <div key={orbit.rotation} className={`absolute inset-0 ${orbit.rotation}`}>
        <div className={`absolute rounded-full border ${orbit.plane}`}>
          <div className={`absolute inset-0 rounded-full ${orbit.motion}`}>
            <span className={`absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full ${orbit.electron}`} />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default HomeAtomAnimation;