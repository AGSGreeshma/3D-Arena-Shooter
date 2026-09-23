export const ARENA = {
  halfSize: 18,
  wallHeight: 4,
  wallThickness: 0.5,
};

export const PLAYER = {
  eyeHeight: 1.6,
  radius: 0.4,
  moveSpeedForward: 4.5,
  moveSpeedBack: 3.0,
  turnSpeed: 2.4,
  maxHealth: 100,
};

export const ENEMY = {
  radius: 0.5,
  maxHealth: 100,
  patrolSpeed: 2.0,
  engageSpeed: 3.2,
  detectRange: 14,
  loseRange: 20,
  losGrace: 2.0,
  preferredRange: 7,
  strafeInterval: 2.2,
  fireCooldownMin: 1.4,
  fireCooldownMax: 2.4,
};

export const COMBAT = {
  playerDamage: 20,
  enemyDamage: 8,
  fireCooldown: 0.25,
  maxRange: 100,
  tracerLife: 0.08,
  flashLife: 0.06,
};

export const PILLARS = [
  { x: 8, z: 8, radius: 1 },
  { x: -8, z: 8, radius: 1 },
  { x: 8, z: -8, radius: 1 },
  { x: -8, z: -8, radius: 1 },
  { x: 0, z: 0, radius: 1.2 },
];

export const WAYPOINTS = [
  { x: 10, z: 10 },
  { x: -10, z: 10 },
  { x: -10, z: -10 },
  { x: 10, z: -10 },
];
