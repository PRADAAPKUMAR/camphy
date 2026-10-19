import { memo } from "react";

/** Static light field: depth without distracting motion or continuous canvas work. */
const PhysicsBackground = memo(() => (
  <div aria-hidden="true" className="physics-light-field pointer-events-none absolute inset-0 overflow-hidden" />
));
PhysicsBackground.displayName = "PhysicsBackground";
export default PhysicsBackground;
