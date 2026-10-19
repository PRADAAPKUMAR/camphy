import { describe, expect, it } from "vitest";
import { createParticle, stepParticle, type Particle } from "@/lib/particles";

const particle = (patch: Partial<Particle> = {}): Particle => ({ x: 50, y: 50, vx: 30, vy: 20, radius: 1, hue: 200, ...patch });

describe("viewport particles", () => {
  it.each([
    [{ x: 1, vx: -30 }, "vx", 1],
    [{ x: 99, vx: 30 }, "vx", -1],
    [{ y: 1, vy: -20 }, "vy", 1],
    [{ y: 99, vy: 20 }, "vy", -1],
  ] as const)("rebounds inward at a screen edge: %j", (patch, axis, direction) => {
    const p = particle(patch);
    const speed = Math.hypot(p.vx, p.vy);
    stepParticle(p, .05, 100, 100, () => .8);
    expect(Math.sign(p[axis])).toBe(direction);
    expect(Math.hypot(p.vx, p.vy)).toBeCloseTo(speed);
    expect(p.x).toBeGreaterThanOrEqual(1);
    expect(p.x).toBeLessThanOrEqual(99);
    expect(p.y).toBeGreaterThanOrEqual(1);
    expect(p.y).toBeLessThanOrEqual(99);
  });

  it("reflects both axes at a corner and survives a viewport resize", () => {
    const p = particle({ x: 120, y: 150 });
    stepParticle(p, .05, 80, 60, () => .5);
    expect(p.vx).toBeLessThan(0);
    expect(p.vy).toBeLessThan(0);
    expect(p.x).toBe(79);
    expect(p.y).toBe(59);
  });

  it("keeps particles bounded over repeated random rebounds", () => {
    const p = createParticle(320, 240);
    for (let i = 0; i < 10000; i++) {
      stepParticle(p, .05, 320, 240);
      expect(p.x).toBeGreaterThanOrEqual(p.radius);
      expect(p.x).toBeLessThanOrEqual(320 - p.radius);
      expect(p.y).toBeGreaterThanOrEqual(p.radius);
      expect(p.y).toBeLessThanOrEqual(240 - p.radius);
    }
  });
});
