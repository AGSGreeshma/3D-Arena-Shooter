import * as THREE from "three";
import { ENEMY, WAYPOINTS } from "./config.js";
import { resolvePosition } from "./collision.js";

export class Enemy {
  constructor(scene, arena) {
    this.arena = arena;
    this.maxHealth = ENEMY.maxHealth;
    this.onDeath = null;

    this.armorMat = new THREE.MeshStandardMaterial({ color: 0x241417, roughness: 0.55, metalness: 0.4 });
    this.accentMat = new THREE.MeshStandardMaterial({
      color: 0x3a0d0d,
      roughness: 0.5,
      metalness: 0.3,
      emissive: 0x550000,
      emissiveIntensity: 0.6,
    });
    this.eyeMat = new THREE.MeshStandardMaterial({
      color: 0xff2200,
      emissive: 0xff2200,
      emissiveIntensity: 2.2,
      roughness: 0.3,
    });

    this.group = this._buildMesh();
    scene.add(this.group);

    this.reset();
  }

  _tag(mesh) {
    mesh.userData.isEnemy = true;
    return mesh;
  }

  _buildMesh() {
    const group = new THREE.Group();
    group.userData.isEnemy = true;

    const legGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.8, 8);
    for (const side of [-1, 1]) {
      const leg = this._tag(new THREE.Mesh(legGeo, this.armorMat));
      leg.position.set(side * 0.22, 0.4, 0);
      leg.castShadow = true;
      group.add(leg);
    }

    const torso = this._tag(
      new THREE.Mesh(new THREE.CapsuleGeometry(ENEMY.radius * 0.85, 0.6, 4, 8), this.armorMat)
    );
    torso.position.y = 1.25;
    torso.castShadow = true;
    group.add(torso);

    const chestCore = this._tag(new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 10), this.eyeMat));
    chestCore.position.set(0, 1.25, -ENEMY.radius * 0.7);
    group.add(chestCore);
    this.chestCore = chestCore;

    const shoulderGeo = new THREE.BoxGeometry(0.32, 0.22, 0.36);
    for (const side of [-1, 1]) {
      const shoulder = this._tag(new THREE.Mesh(shoulderGeo, this.accentMat));
      shoulder.position.set(side * 0.38, 1.62, 0);
      shoulder.castShadow = true;
      group.add(shoulder);
    }

    const armGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.7, 8);
    for (const side of [-1, 1]) {
      const arm = this._tag(new THREE.Mesh(armGeo, this.armorMat));
      arm.position.set(side * 0.38, 1.25, 0);
      arm.castShadow = true;
      group.add(arm);
    }

    const head = this._tag(new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.3, 0.3), this.armorMat));
    head.position.y = 1.95;
    head.castShadow = true;
    group.add(head);

    const eyeGeo = new THREE.SphereGeometry(0.045, 8, 8);
    this.eyes = [];
    for (const side of [-1, 1]) {
      const eye = this._tag(new THREE.Mesh(eyeGeo, this.eyeMat));
      eye.position.set(side * 0.08, 1.98, -0.16);
      group.add(eye);
      this.eyes.push(eye);
    }

    const antenna = this._tag(
      new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.25, 6), this.accentMat)
    );
    antenna.position.set(0, 2.22, -0.05);
    group.add(antenna);

    const gun = this._tag(
      new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.55), new THREE.MeshStandardMaterial({ color: 0x111114, roughness: 0.4, metalness: 0.6 }))
    );
    gun.position.set(0.38, 1.15, -0.45);
    group.add(gun);

    const glow = new THREE.PointLight(0xff2200, 0.6, 4);
    glow.position.set(0, 1.9, 0.1);
    group.add(glow);
    this.glowLight = glow;

    return group;
  }

  reset() {
    this.x = WAYPOINTS[0].x;
    this.z = WAYPOINTS[0].z;
    this.yaw = 0;
    this.health = this.maxHealth;
    this.alive = true;
    this.state = "PATROL";
    this.waypointIndex = 0;
    this.losLostTime = 0;
    this.fireTimer = this._randomFireCooldown();
    this.strafeTimer = ENEMY.strafeInterval;
    this.strafeDir = 1;
    this.armorMat.emissive.setHex(0x000000);
    this.eyeMat.color.setHex(0xff2200);
    this.eyeMat.emissive.setHex(0xff2200);
    this.eyeMat.emissiveIntensity = 2.2;
    this.glowLight.intensity = 0.6;
    this.group.visible = true;
    this.group.rotation.set(0, 0, 0);
    this._syncMesh();
  }

  get eyePosition() {
    return new THREE.Vector3(this.x, 1.95, this.z);
  }

  _randomFireCooldown() {
    return ENEMY.fireCooldownMin + Math.random() * (ENEMY.fireCooldownMax - ENEMY.fireCooldownMin);
  }

  hasLineOfSight(playerPos, obstacleMeshes, raycaster) {
    const from = this.eyePosition;
    const dir = playerPos.clone().sub(from);
    const dist = dir.length();
    dir.normalize();
    raycaster.set(from, dir);
    raycaster.far = dist;
    const hits = raycaster.intersectObjects(obstacleMeshes, false);
    raycaster.far = Infinity;
    return hits.length === 0;
  }

  update(dt, player, obstacleMeshes, raycaster, onPlayerHit, fireTracer) {
    if (!this.alive) return;

    const playerPos = player.getPosition();
    const toPlayer = new THREE.Vector3(playerPos.x - this.x, 0, playerPos.z - this.z);
    const distToPlayer = toPlayer.length();
    const losClear = this.hasLineOfSight(playerPos, obstacleMeshes, raycaster);

    if (this.state === "PATROL") {
      if (distToPlayer < ENEMY.detectRange && losClear) {
        this.state = "ENGAGE";
        this.losLostTime = 0;
      } else {
        this._patrol(dt);
      }
    } else if (this.state === "ENGAGE") {
      if (losClear) {
        this.losLostTime = 0;
      } else {
        this.losLostTime += dt;
      }

      if (distToPlayer > ENEMY.loseRange || this.losLostTime > ENEMY.losGrace) {
        this.state = "PATROL";
      } else {
        this._engage(dt, playerPos, toPlayer, distToPlayer, losClear, onPlayerHit, fireTracer);
      }
    }

    this._syncMesh();
  }

  _patrol(dt) {
    const wp = WAYPOINTS[this.waypointIndex];
    const dx = wp.x - this.x;
    const dz = wp.z - this.z;
    const dist = Math.hypot(dx, dz);

    if (dist < 0.5) {
      this.waypointIndex = (this.waypointIndex + 1) % WAYPOINTS.length;
      return;
    }

    this.yaw = Math.atan2(-dx, -dz);
    const move = ENEMY.patrolSpeed * dt;
    const candidate = { x: this.x + (dx / dist) * move, z: this.z + (dz / dist) * move };
    const resolved = resolvePosition(candidate, ENEMY.radius, this.arena.colliders, this.arena.bounds);
    this.x = resolved.x;
    this.z = resolved.z;
  }

  _engage(dt, playerPos, toPlayer, distToPlayer, losClear, onPlayerHit, fireTracer) {
    this.yaw = Math.atan2(-toPlayer.x, -toPlayer.z);

    this.strafeTimer -= dt;
    if (this.strafeTimer <= 0) {
      this.strafeDir *= -1;
      this.strafeTimer = ENEMY.strafeInterval;
    }

    const dirNorm = toPlayer.clone().normalize();
    const perp = new THREE.Vector3(-dirNorm.z, 0, dirNorm.x);

    let moveX = 0;
    let moveZ = 0;

    if (distToPlayer > ENEMY.preferredRange + 1.5) {
      moveX += dirNorm.x;
      moveZ += dirNorm.z;
    } else if (distToPlayer < ENEMY.preferredRange - 1.5) {
      moveX -= dirNorm.x;
      moveZ -= dirNorm.z;
    } else {
      moveX += perp.x * this.strafeDir;
      moveZ += perp.z * this.strafeDir;
    }

    const moveLen = Math.hypot(moveX, moveZ);
    if (moveLen > 1e-4) {
      const move = ENEMY.engageSpeed * dt;
      const candidate = {
        x: this.x + (moveX / moveLen) * move,
        z: this.z + (moveZ / moveLen) * move,
      };
      const resolved = resolvePosition(candidate, ENEMY.radius, this.arena.colliders, this.arena.bounds);
      this.x = resolved.x;
      this.z = resolved.z;
    }

    this.fireTimer -= dt;
    if (this.fireTimer <= 0 && losClear) {
      this.fireTimer = this._randomFireCooldown();
      this._fire(playerPos, distToPlayer, onPlayerHit, fireTracer);
    }
  }

  _fire(playerPos, distToPlayer, onPlayerHit, fireTracer) {
    const hitChance = Math.min(0.75, Math.max(0.25, 0.75 - distToPlayer / 40));
    const hit = Math.random() < hitChance;
    const from = this.eyePosition;
    let to;

    if (hit) {
      to = playerPos.clone();
      onPlayerHit();
    } else {
      to = playerPos.clone().add(
        new THREE.Vector3((Math.random() - 0.5) * 2.2, (Math.random() - 0.5) * 1.6, (Math.random() - 0.5) * 2.2)
      );
    }

    fireTracer(from, to, 0xff5544);
  }

  takeDamage(amount) {
    if (!this.alive) return;
    this.health = Math.max(0, this.health - amount);
    this._flashHit();

    if (this.health === 0) {
      this.alive = false;
      this._powerDown();
      this._playDeath();
      this.onDeath?.();
    }
  }

  _flashHit() {
    this.armorMat.emissive.setHex(0xffffff);
    setTimeout(() => {
      if (this.alive) this.armorMat.emissive.setHex(0x000000);
    }, 80);
  }

  _powerDown() {
    this.eyeMat.color.setHex(0x1a1a1a);
    this.eyeMat.emissive.setHex(0x000000);
    this.glowLight.intensity = 0;
  }

  _playDeath() {
    const start = performance.now();
    const duration = 600;
    const animate = () => {
      const t = Math.min(1, (performance.now() - start) / duration);
      this.group.rotation.z = -(Math.PI / 2) * t;
      if (t < 1 && !this.alive) requestAnimationFrame(animate);
    };
    animate();
  }

  _syncMesh() {
    this.group.position.set(this.x, 0, this.z);
    this.group.rotation.y = this.yaw;
  }
}
