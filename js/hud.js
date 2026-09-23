const HEALTH_STYLES = [
  { min: 60, bg: "linear-gradient(90deg, #17c2a4, #35ff9c)", glow: "rgba(53, 255, 156, 0.7)" },
  { min: 30, bg: "linear-gradient(90deg, #d18f00, #ffcc33)", glow: "rgba(255, 204, 51, 0.7)" },
  { min: 0, bg: "linear-gradient(90deg, #b3001b, #ff3b4e)", glow: "rgba(255, 59, 78, 0.75)" },
];

export class HUD {
  constructor({ onRestart }) {
    this.playerBarFill = document.getElementById("player-health-fill");
    this.enemyBarFill = document.getElementById("enemy-health-fill");
    this.hitCounterEl = document.getElementById("hit-counter");
    this.overlay = document.getElementById("overlay");
    this.overlayTitle = document.getElementById("overlay-title");
    this.restartBtn = document.getElementById("restart-btn");
    this.vignette = document.getElementById("hit-flash-vignette");
    this.crosshair = document.getElementById("crosshair");
    this.hitMarker = document.getElementById("hit-marker");

    this.hits = 0;

    this.restartBtn.addEventListener("click", () => onRestart());
  }

  update(player, enemy) {
    this._setBar(this.playerBarFill, player.health, player.maxHealth);
    this._setBar(this.enemyBarFill, enemy.health, enemy.maxHealth);
  }

  _setBar(el, health, maxHealth) {
    const pct = Math.max(0, Math.min(100, (health / maxHealth) * 100));
    const style = HEALTH_STYLES.find((s) => pct > s.min) ?? HEALTH_STYLES[HEALTH_STYLES.length - 1];
    el.style.width = pct + "%";
    el.style.background = style.bg;
    el.style.boxShadow = `0 0 10px 0 ${style.glow}`;
  }

  pulseCrosshair() {
    this.crosshair.classList.remove("pulse");
    void this.crosshair.offsetWidth;
    this.crosshair.classList.add("pulse");
  }

  showHitMarker() {
    this.hitMarker.classList.remove("show");
    void this.hitMarker.offsetWidth;
    this.hitMarker.classList.add("show");
  }

  registerHit() {
    this.hits += 1;
    this.hitCounterEl.textContent = `Hits: ${this.hits}`;
  }

  resetHits() {
    this.hits = 0;
    this.hitCounterEl.textContent = "Hits: 0";
  }

  flashDamage() {
    this.vignette.classList.remove("flash");
    void this.vignette.offsetWidth;
    this.vignette.classList.add("flash");
  }

  showOverlay(won) {
    this.overlayTitle.textContent = won ? "VICTORY!" : "GAME OVER";
    this.overlayTitle.style.color = won ? "#4caf50" : "#e53935";
    this.overlay.classList.add("visible");
  }

  hideOverlay() {
    this.overlay.classList.remove("visible");
  }
}
