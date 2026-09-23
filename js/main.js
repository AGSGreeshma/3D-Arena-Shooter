import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { COMBAT } from "./config.js";
import { createArena } from "./arena.js";
import { InputManager } from "./input.js";
import { Player } from "./player.js";
import { Enemy } from "./enemy.js";
import { CombatSystem } from "./combat.js";
import { HUD } from "./hud.js";
import { GameManager } from "./gameState.js";

const app = document.getElementById("app");

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.85,
  0.5,
  0.2
);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

const arena = createArena(scene);

const input = new InputManager();
const player = new Player(camera, arena);
const enemy = new Enemy(scene, arena);
const combat = new CombatSystem(scene);
const hud = new HUD({ onRestart: () => game.resetGame() });
const game = new GameManager({ player, enemy, hud, combat });

const enemyLosRaycaster = new THREE.Raycaster();
let lastTime = performance.now() / 1000;

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

renderer.setAnimationLoop(() => {
  const now = performance.now() / 1000;
  const dt = Math.min(now - lastTime, 0.1);
  lastTime = now;

  if (game.isPlaying) {
    player.update(dt, input);

    enemy.update(
      dt,
      player,
      arena.obstacleMeshes,
      enemyLosRaycaster,
      () => {
        player.takeDamage(COMBAT.enemyDamage);
        hud.flashDamage();
      },
      (from, to, color) => combat.fireTracer(from, to, color)
    );

    if (input.isDown("Space")) {
      const fired = combat.playerShoot(now, camera, [enemy.group], arena.obstacleMeshes, () => {
        enemy.takeDamage(COMBAT.playerDamage);
        hud.registerHit();
        hud.showHitMarker();
      });
      if (fired) hud.pulseCrosshair();
    }
  }

  combat.update(now);
  hud.update(player, enemy);
  composer.render();
});
