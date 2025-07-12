import { InteractivePointerManager } from "./interactive-pointer.js";

export class DarkInteractivePointerManager extends InteractivePointerManager {
  constructor() {
    super();

    this.darkGrayColors = [
      [0.15, 0.15, 0.15], // #262626
      [0.2, 0.2, 0.2], // #333333
      [0.25, 0.25, 0.25], // #404040
      [0.18, 0.18, 0.18], // #2d2d2d
      [0.22, 0.22, 0.22], // #383838
      [0.12, 0.12, 0.12], // #1f1f1f
    ];

    this.vanillaColors = this.darkGrayColors;

    const pointer = this.createPointer();
    pointer.color = this.getRandomDarkColor();
    this.pointers = [pointer];
  }

  updateColorBasedOnMovement(pointer, currentTime) {
    const velocityFactor = Math.min(pointer.velocity / 100, 1.0);

    const timeFactor = (currentTime * 0.001) % (this.darkGrayColors.length * 2);
    const colorIndex = Math.floor(timeFactor) % this.darkGrayColors.length;
    const nextColorIndex = (colorIndex + 1) % this.darkGrayColors.length;

    const t = (timeFactor % 1) * velocityFactor;
    const currentColor = this.darkGrayColors[colorIndex];
    const nextColor = this.darkGrayColors[nextColorIndex];

    pointer.color = [
      currentColor[0] * (1 - t) + nextColor[0] * t,
      currentColor[1] * (1 - t) + nextColor[1] * t,
      currentColor[2] * (1 - t) + nextColor[2] * t,
    ];

    if (velocityFactor > 0.5) {
      pointer.color = pointer.color.map((c) => Math.min(c * 1.2, 0.5));
    }
  }

  handleMouseDown(event, canvasRect) {
    const pointer = this.pointers[0];
    pointer.down = true;

    pointer.color = [0.5, 0.5, 0.5]; // cinza mais claro para clique
    pointer.intensity = 3.0;

    this.createClickBurst(pointer);
  }

  createClickBurst(pointer) {
    const burstCount = 8;
    const burstRadius = 50;

    for (let i = 0; i < burstCount; i++) {
      const angle = (i / burstCount) * Math.PI * 2;
      const offsetX = Math.cos(angle) * burstRadius;
      const offsetY = Math.sin(angle) * burstRadius;

      this.pointers.push({
        ...this.createPointer(),
        x: pointer.x + offsetX,
        y: pointer.y + offsetY,
        dx: offsetX * 0.5,
        dy: offsetY * 0.5,
        moved: true,
        color: [0.4, 0.4, 0.4], // cinza médio
        intensity: 2.0,
        isBurst: true,
        burstLife: 1.0,
      });
    }
  }

  createIdleAnimation() {
    const pointer = this.pointers[0];
    const currentTime = Date.now();

    if (
      currentTime - this.lastMouseTime > 3000 &&
      !pointer.down &&
      !this.isMouseInsideCanvas
    ) {
      const time = currentTime * 0.001;
      const waveX = Math.sin(time * 0.5) * 1;
      const waveY = Math.cos(time * 0.3) * 1;

      pointer.dx = waveX;
      pointer.dy = waveY;
      pointer.moved = true;
      pointer.intensity = 0.1;
      pointer.color =
        this.darkGrayColors[Math.floor(time) % this.darkGrayColors.length];
    }
  }

  getRandomDarkColor() {
    const randomIndex = Math.floor(Math.random() * this.darkGrayColors.length);
    return [...this.darkGrayColors[randomIndex]];
  }
}
