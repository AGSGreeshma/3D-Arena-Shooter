import * as THREE from "three";
import { COMBAT } from "./config.js";

const UP = new THREE.Vector3(0, 1, 0);

export class CombatSystem {
  constructor(scene) {
    this.scene = scene;
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = COMBAT.maxRange;
    this.effects = [];
    this.lastShotTime = -Infinity;
    this.glowTexture = this._createGlowTexture();
  }

  _createGlowTexture() {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.35, "rgba(255,255,255,0.85)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  canFire(now) {
    return now - this.lastShotTime >= COMBAT.fireCooldown;
  }

  playerShoot(now, camera, enemyTargets, obstacleMeshes, onHitEnemy) {
    if (!this.canFire(now)) return false;
    this.lastShotTime = now;

    this.raycaster.setFromCamera({ x: 0, y: 0 }, camera);
    const hits = this.raycaster.intersectObjects([...enemyTargets, ...obstacleMeshes], true);

    const from = camera.position.clone();
    let to;

    if (hits.length > 0) {
      const hit = hits[0];
      to = hit.point.clone();

      let obj = hit.object;
      let isEnemy = false;
      while (obj) {
        if (obj.userData?.isEnemy) {
          isEnemy = true;
          break;
        }
        obj = obj.parent;
      }
      if (isEnemy) onHitEnemy();
    } else {
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      to = from.clone().add(dir.multiplyScalar(COMBAT.maxRange));
    }

    this._spawnTracer(from, to, 0xaef6ff);
    return true;
  }

  fireTracer(from, to, color) {
    this._spawnTracer(from, to, color);
  }

  _spawnTracer(from, to, color) {
    const now = performance.now() / 1000;
    const delta = new THREE.Vector3().subVectors(to, from);
    const length = Math.max(delta.length(), 0.01);

    const beamGeo = new THREE.CylinderGeometry(0.012, 0.02, length, 6, 1, true);
    beamGeo.translate(0, length / 2, 0);
    const beamMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.copy(from);
    beam.quaternion.setFromUnitVectors(UP, delta.normalize());
    this.scene.add(beam);
    this.effects.push({ obj: beam, mat: beamMat, ownGeo: true, expireAt: now + COMBAT.tracerLife });

    const flashMat = new THREE.SpriteMaterial({
      map: this.glowTexture,
      color,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const flash = new THREE.Sprite(flashMat);
    flash.scale.setScalar(0.4);
    flash.position.copy(from);
    this.scene.add(flash);
    this.effects.push({ obj: flash, mat: flashMat, ownGeo: false, expireAt: now + COMBAT.flashLife });

    const impactMat = new THREE.SpriteMaterial({
      map: this.glowTexture,
      color,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const impact = new THREE.Sprite(impactMat);
    impact.scale.setScalar(0.22);
    impact.position.copy(to);
    this.scene.add(impact);
    this.effects.push({ obj: impact, mat: impactMat, ownGeo: false, expireAt: now + COMBAT.flashLife * 1.5 });

    const burst = new THREE.PointLight(color, 3.5, 3.5, 2);
    burst.position.copy(from);
    this.scene.add(burst);
    this.effects.push({ obj: burst, mat: null, ownGeo: false, expireAt: now + COMBAT.flashLife });
  }

  update(now) {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const e = this.effects[i];
      if (now >= e.expireAt) {
        this.scene.remove(e.obj);
        if (e.ownGeo) e.obj.geometry?.dispose();
        e.mat?.dispose();
        this.effects.splice(i, 1);
      }
    }
  }

  clear() {
    for (const e of this.effects) {
      this.scene.remove(e.obj);
      if (e.ownGeo) e.obj.geometry?.dispose();
      e.mat?.dispose();
    }
    this.effects = [];
    this.lastShotTime = -Infinity;
  }
}
