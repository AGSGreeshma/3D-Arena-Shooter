import * as THREE from "three";
import { PLAYER } from "./config.js";
import { resolvePosition } from "./collision.js";

const UP = new THREE.Vector3(0, 1, 0);
const FORWARD = new THREE.Vector3(0, 0, -1);

export class Player {
  constructor(camera, arena) {
    this.camera = camera;
    this.arena = arena;
    this.maxHealth = PLAYER.maxHealth;
    this.onDeath = null;
    this.reset();
  }

  reset() {
    this.x = 0;
    this.z = 12;
    this.yaw = 0;
    this.health = this.maxHealth;
    this.alive = true;
    this._syncCamera();
  }

  getForward() {
    return FORWARD.clone().applyAxisAngle(UP, this.yaw);
  }

  getPosition() {
    return new THREE.Vector3(this.x, PLAYER.eyeHeight, this.z);
  }

  update(dt, input) {
    if (!this.alive) return;

    if (input.isDown("ArrowLeft")) this.yaw += PLAYER.turnSpeed * dt;
    if (input.isDown("ArrowRight")) this.yaw -= PLAYER.turnSpeed * dt;

    let moveDist = 0;
    if (input.isDown("ArrowUp")) moveDist += PLAYER.moveSpeedForward * dt;
    if (input.isDown("ArrowDown")) moveDist -= PLAYER.moveSpeedBack * dt;

    if (moveDist !== 0) {
      const forward = this.getForward();
      const candidate = {
        x: this.x + forward.x * moveDist,
        z: this.z + forward.z * moveDist,
      };
      const resolved = resolvePosition(
        candidate,
        PLAYER.radius,
        this.arena.colliders,
        this.arena.bounds
      );
      this.x = resolved.x;
      this.z = resolved.z;
    }

    this._syncCamera();
  }

  _syncCamera() {
    this.camera.position.set(this.x, PLAYER.eyeHeight, this.z);
    this.camera.rotation.set(0, this.yaw, 0);
  }

  takeDamage(amount) {
    if (!this.alive) return;
    this.health = Math.max(0, this.health - amount);
    if (this.health === 0) {
      this.alive = false;
      this.onDeath?.();
    }
  }
}
