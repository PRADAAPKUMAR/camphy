const orbitClasses = [
  "rotate-0",
  "rotate-60",
  "-rotate-60",
] as const;

const HomeAtomAnimation = () => (
  <div
    className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 opacity-50 sm:h-80 sm:w-80"
    aria-hidden="true"
  >
    <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/40 shadow-[0_0_22px_hsl(217_91%_60%/0.45)]" />
    {orbitClasses.map((rotation, index) => (
      <div
        key={rotation}
        className={`absolute inset-[16%] rounded-[50%] border border-primary/20 ${rotation}`}
        style={{ aspectRatio: "1 / 0.42" }}
      >
        <div
          className="absolute inset-0 motion-safe:animate-[spin_7s_linear_infinite]"
          style={{ animationDelay: `${index * -2.3}s` }}
        >
          <span className="absolute -top-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-accent/80 shadow-[0_0_14px_hsl(199_89%_48%/0.65)]" />
        </div>
      </div>
    ))}
  </div>
);

export default HomeAtomAnimation;