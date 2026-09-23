import * as THREE from "three";
import { ARENA, PILLARS } from "./config.js";

const SKY_TOP = 0x05070d;
const SKY_HORIZON = 0x1c2740;

function createSkyTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 2;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#" + SKY_TOP.toString(16).padStart(6, "0"));
  gradient.addColorStop(0.55, "#" + SKY_HORIZON.toString(16).padStart(6, "0"));
  gradient.addColorStop(1, "#" + SKY_HORIZON.toString(16).padStart(6, "0"));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createArena(scene) {
  const half = ARENA.halfSize;

  scene.background = createSkyTexture();
  scene.fog = new THREE.Fog(SKY_HORIZON, 18, 48);

  const hemi = new THREE.HemisphereLight(0x4f6fa8, 0x0c0e14, 1.4);
  scene.add(hemi);

  const dir = new THREE.DirectionalLight(0xcfe3ff, 1.4);
  dir.position.set(12, 24, 8);
  dir.castShadow = true;
  dir.shadow.mapSize.set(1024, 1024);
  dir.shadow.camera.left = -half;
  dir.shadow.camera.right = half;
  dir.shadow.camera.top = half;
  dir.shadow.camera.bottom = -half;
  scene.add(dir);

  const rim = new THREE.DirectionalLight(0x3ad6ff, 0.35);
  rim.position.set(-10, 8, -14);
  scene.add(rim);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(half * 2, half * 2),
    new THREE.MeshStandardMaterial({ color: 0x272733, roughness: 0.85, metalness: 0.15 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const grid = new THREE.GridHelper(half * 2, 20, 0x3ad6ff, 0x2a3550);
  grid.position.y = 0.01;
  grid.material.transparent = true;
  grid.material.opacity = 0.35;
  scene.add(grid);

  const emblem = new THREE.Mesh(
    new THREE.RingGeometry(1.4, 1.55, 48),
    new THREE.MeshBasicMaterial({ color: 0x3ad6ff, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
  );
  emblem.rotation.x = -Math.PI / 2;
  emblem.position.y = 0.015;
  scene.add(emblem);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0x33333f, roughness: 0.75, metalness: 0.2 });
  const trimMat = new THREE.MeshBasicMaterial({ color: 0x3ad6ff });
  const wallDefs = [
    { x: 0, z: -half, w: half * 2, d: ARENA.wallThickness },
    { x: 0, z: half, w: half * 2, d: ARENA.wallThickness },
    { x: -half, z: 0, w: ARENA.wallThickness, d: half * 2 },
    { x: half, z: 0, w: ARENA.wallThickness, d: half * 2 },
  ];

  const wallMeshes = wallDefs.map((w) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w.w, ARENA.wallHeight, w.d), wallMat);
    mesh.position.set(w.x, ARENA.wallHeight / 2, w.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    const trim = new THREE.Mesh(new THREE.BoxGeometry(w.w * 0.98, 0.08, w.d + 0.02), trimMat);
    trim.position.set(w.x, 0.55, w.z);
    scene.add(trim);

    return mesh;
  });

  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x484858, roughness: 0.6, metalness: 0.3 });
  const pillarMeshes = PILLARS.map((p) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(p.radius, p.radius, 3, 16), pillarMat);
    mesh.position.set(p.x, 1.5, p.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(p.radius + 0.03, 0.025, 8, 24),
      trimMat
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.set(p.x, 0.15, p.z);
    scene.add(ring);

    return mesh;
  });

  const inset = 1.0;
  const bounds = {
    minX: -half + inset,
    maxX: half - inset,
    minZ: -half + inset,
    maxZ: half - inset,
  };

  return {
    bounds,
    colliders: PILLARS,
    obstacleMeshes: [...wallMeshes, ...pillarMeshes],
  };
}
