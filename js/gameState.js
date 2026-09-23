export class GameManager {
  constructor({ player, enemy, hud, combat }) {
    this.player = player;
    this.enemy = enemy;
    this.hud = hud;
    this.combat = combat;
    this.state = "PLAYING";

    this.player.onDeath = () => this.setState("LOST");
    this.enemy.onDeath = () => this.setState("WON");
  }

  setState(newState) {
    if (this.state !== "PLAYING") return;
    this.state = newState;
    this.hud.showOverlay(newState === "WON");
  }

  resetGame() {
    this.player.reset();
    this.enemy.reset();
    this.combat.clear();
    this.hud.resetHits();
    this.hud.hideOverlay();
    this.state = "PLAYING";
  }

  get isPlaying() {
    return this.state === "PLAYING";
  }
}
