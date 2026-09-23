export function resolvePosition(candidate, radius, colliders, bounds) {
  const pos = { x: candidate.x, z: candidate.z };

  pos.x = Math.min(bounds.maxX, Math.max(bounds.minX, pos.x));
  pos.z = Math.min(bounds.maxZ, Math.max(bounds.minZ, pos.z));

  for (const c of colliders) {
    const dx = pos.x - c.x;
    const dz = pos.z - c.z;
    const minDist = c.radius + radius;
    const distSq = dx * dx + dz * dz;

    if (distSq < minDist * minDist && distSq > 1e-6) {
      const dist = Math.sqrt(distSq);
      const push = minDist - dist;
      pos.x += (dx / dist) * push;
      pos.z += (dz / dist) * push;
    }
  }

  return pos;
}
