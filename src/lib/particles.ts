export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hue: number;
}

export function createParticle(width: number, height: number, random = Math.random): Particle {
  const angle = random() * Math.PI * 2;
  const speed = 20 + random() * 26;
  const radius = .7 + random() * .9;
  return {
    x: radius + random() * Math.max(0, width - radius * 2),
    y: radius + random() * Math.max(0, height - radius * 2),
    vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
    radius, hue: 185 + random() * 90,
  };
}

/** Reflect inward at each viewport edge, varying the rebound angle slightly. */
export function stepParticle(p: Particle, seconds: number, width: number, height: number, random = Math.random) {
  const minX = Math.min(p.radius, width / 2);
  const minY = Math.min(p.radius, height / 2);
  const maxX = Math.max(minX, width - p.radius);
  const maxY = Math.max(minY, height - p.radius);
  p.x += p.vx * seconds;
  p.y += p.vy * seconds;
  const hitX = p.x <= minX || p.x >= maxX;
  const hitY = p.y <= minY || p.y >= maxY;
  if (hitX || hitY) {
    const speed = Math.hypot(p.vx, p.vy);
    const angle = Math.atan2(p.vy, p.vx) + (random() - .5) * .3;
    let vx = Math.cos(angle) * speed;
    let vy = Math.sin(angle) * speed;
    if (hitX) vx = (p.x <= minX ? 1 : -1) * Math.max(Math.abs(vx), speed * .2);
    if (hitY) vy = (p.y <= minY ? 1 : -1) * Math.max(Math.abs(vy), speed * .2);
    const normalize = speed / (Math.hypot(vx, vy) || 1);
    p.vx = vx * normalize;
    p.vy = vy * normalize;
  }
  p.x = Math.min(maxX, Math.max(minX, p.x));
  p.y = Math.min(maxY, Math.max(minY, p.y));
}
