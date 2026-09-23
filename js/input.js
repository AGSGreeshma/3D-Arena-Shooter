const TRACKED_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Space",
]);

export class InputManager {
  constructor() {
    this.keys = new Set();

    window.addEventListener("keydown", (e) => {
      if (TRACKED_KEYS.has(e.code)) e.preventDefault();
      this.keys.add(e.code);
    });

    window.addEventListener("keyup", (e) => {
      this.keys.delete(e.code);
    });

    window.addEventListener("blur", () => {
      this.keys.clear();
    });
  }

  isDown(code) {
    return this.keys.has(code);
  }
}
