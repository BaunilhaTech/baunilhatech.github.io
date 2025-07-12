/**
 * Interactive Pointer Manager - Versão Simplificada
 *
 * Gerencia interações do mouse/touch com detecção simples e confiável.
 */

export class InteractivePointerManager {
  constructor() {
    this.mouseTrail = [];
    this.maxTrailLength = 10;
    this.lastMouseTime = 0;
    this.mouseMoveThreshold = 2;
    this.isMouseInsideCanvas = false;
    this.fadeOutTimer = null;

    this.vanillaColors = [
      [0.957, 0.816, 0.247], // #f4d03f
      [0.831, 0.647, 0.455], // #d4a574
      [0.91, 0.773, 0.278], // #e8c547
      [0.98, 0.941, 0.902], // #faf0e6
      [1.0, 0.843, 0.0], // #ffd700
      [0.855, 0.647, 0.125], // #daa520
    ];

    this.currentColorIndex = 0;
    this.colorTransition = 0;
    this.pointers = [this.createPointer()];
  }

  createPointer() {
    return {
      id: -1,
      x: 0,
      y: 0,
      dx: 0,
      dy: 0,
      down: false,
      moved: false,
      color: this.vanillaColors[0],
      intensity: 0,
      velocity: 0,
      lastX: 0,
      lastY: 0,
      trail: [],
    };
  }

  updateMousePosition(event, canvasRect) {
    if (!this.isMouseInsideCanvas) {
      return;
    }

    const pointer = this.pointers[0];
    const currentTime = Date.now();

    const newX =
      event.offsetX !== undefined
        ? event.offsetX
        : event.clientX - canvasRect.left;
    const newY =
      event.offsetY !== undefined
        ? event.offsetY
        : event.clientY - canvasRect.top;

    const deltaX = newX - pointer.x;
    const deltaY = newY - pointer.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const timeDelta = currentTime - this.lastMouseTime;

    if (timeDelta > 0) {
      pointer.velocity = (distance / timeDelta) * 100;
    }

    pointer.lastX = pointer.x;
    pointer.lastY = pointer.y;
    pointer.x = newX;
    pointer.y = newY;
    pointer.dx = deltaX * 8.0;
    pointer.dy = deltaY * 8.0;

    pointer.moved = distance > this.mouseMoveThreshold;

    this.updateColorBasedOnMovement(pointer, currentTime);
    pointer.intensity = Math.min(pointer.velocity / 50, 2.0);
    this.updateMouseTrail(pointer);

    this.lastMouseTime = currentTime;
  }

  updateColorBasedOnMovement(pointer, currentTime) {
    const velocityFactor = Math.min(pointer.velocity / 100, 1.0);

    const timeFactor = (currentTime * 0.001) % (this.vanillaColors.length * 2);
    const colorIndex = Math.floor(timeFactor) % this.vanillaColors.length;
    const nextColorIndex = (colorIndex + 1) % this.vanillaColors.length;

    const t = (timeFactor % 1) * velocityFactor;
    const currentColor = this.vanillaColors[colorIndex];
    const nextColor = this.vanillaColors[nextColorIndex];

    pointer.color = [
      currentColor[0] * (1 - t) + nextColor[0] * t,
      currentColor[1] * (1 - t) + nextColor[1] * t,
      currentColor[2] * (1 - t) + nextColor[2] * t,
    ];

    if (velocityFactor > 0.5) {
      pointer.color = pointer.color.map((c) => Math.min(c * 1.2, 1.0));
    }
  }

  updateMouseTrail(pointer) {
    pointer.trail.push({
      x: pointer.x,
      y: pointer.y,
      time: Date.now(),
      intensity: pointer.intensity * 0.3,
    });

    const maxAge = 200;
    const currentTime = Date.now();
    pointer.trail = pointer.trail.filter(
      (point) => currentTime - point.time < maxAge
    );

    if (pointer.trail.length > this.maxTrailLength) {
      pointer.trail = pointer.trail.slice(-this.maxTrailLength);
    }
  }

  handleMouseDown(event, canvasRect) {
    const pointer = this.pointers[0];
    pointer.down = true;

    pointer.color = [1.0, 0.843, 0.0]; // #ffd700
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
        color: [1.0, 0.843, 0.0], // #ffd700
        intensity: 2.0,
        isBurst: true,
        burstLife: 1.0,
      });
    }
  }

  handleMouseUp() {
    const pointer = this.pointers[0];
    pointer.down = false;
    pointer.intensity = Math.max(pointer.intensity * 0.5, 0.1);
  }

  // Métodos simples e diretos para entrada/saída
  handleMouseEnter() {
    this.isMouseInsideCanvas = true;
    this.clearFadeOutTimer();

    const pointer = this.pointers[0];
    if (pointer) {
      pointer.intensity = Math.max(pointer.intensity, 0.1);
    }
  }

  handleMouseLeave() {
    this.isMouseInsideCanvas = false;

    const pointer = this.pointers[0];
    if (pointer) {
      pointer.moved = false;
      // Inicia fade out gradual
      this.startFadeOut();
    }
  }

  startFadeOut() {
    this.clearFadeOutTimer();

    const fadeOutStep = () => {
      const pointer = this.pointers[0];
      if (pointer && !this.isMouseInsideCanvas) {
        pointer.intensity *= 0.9;

        if (pointer.intensity > 0.01) {
          this.fadeOutTimer = setTimeout(fadeOutStep, 32);
        } else {
          pointer.intensity = 0;
          pointer.moved = false;
        }
      }
    };

    fadeOutStep();
  }

  clearFadeOutTimer() {
    if (this.fadeOutTimer) {
      clearTimeout(this.fadeOutTimer);
      this.fadeOutTimer = null;
    }
  }

  handleTouchStart(touches, canvasRect) {
    for (let i = 0; i < touches.length; i++) {
      this.ensurePointerExists(i);

      const pointer = this.pointers[i];
      const touch = touches[i];

      pointer.id = touch.identifier;
      pointer.down = true;
      pointer.x = touch.clientX - canvasRect.left;
      pointer.y = touch.clientY - canvasRect.top;
      pointer.color = this.getRandomVanillaColor();
      pointer.intensity = 2.0;
    }
  }

  handleTouchEnd(changedTouches) {
    for (let i = 0; i < changedTouches.length; i++) {
      const touchId = changedTouches[i].identifier;
      const pointer = this.findPointerById(touchId);

      if (pointer) {
        pointer.down = false;
        pointer.intensity *= 0.5;
      }
    }
  }

  updateTouchPositions(touches, canvasRect) {
    const currentTime = Date.now();

    for (let i = 0; i < touches.length; i++) {
      this.ensurePointerExists(i);

      const pointer = this.pointers[i];
      const touch = touches[i];

      const newX = touch.clientX - canvasRect.left;
      const newY = touch.clientY - canvasRect.top;

      const deltaX = newX - pointer.x;
      const deltaY = newY - pointer.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const timeDelta = currentTime - this.lastMouseTime;

      if (timeDelta > 0) {
        pointer.velocity = (distance / timeDelta) * 100;
      }

      pointer.lastX = pointer.x;
      pointer.lastY = pointer.y;
      pointer.x = newX;
      pointer.y = newY;
      pointer.dx = deltaX * 8.0;
      pointer.dy = deltaY * 8.0;

      pointer.moved = distance > this.mouseMoveThreshold;

      this.updateColorBasedOnMovement(pointer, currentTime);
      pointer.intensity = Math.min(pointer.velocity / 50, 2.0);

      this.updateMouseTrail(pointer);
    }

    this.lastMouseTime = currentTime;
  }

  updateBurstEffects() {
    this.pointers = this.pointers.filter((pointer) => {
      if (pointer.isBurst) {
        pointer.burstLife -= 0.02;
        pointer.intensity = pointer.burstLife * 2.0;
        return pointer.burstLife > 0;
      }
      return true;
    });
  }

  getMovedPointers() {
    this.updateBurstEffects();

    const movedPointers = this.pointers.filter((pointer) => pointer.moved);

    const mainPointer = this.pointers[0];
    if (mainPointer.trail.length > 1 && this.isMouseInsideCanvas) {
      const trailEffects = mainPointer.trail.slice(-3).map((point, index) => ({
        x: point.x,
        y: point.y,
        dx: 0,
        dy: 0,
        moved: true,
        color: mainPointer.color.map((c) => c * (0.3 + index * 0.2)),
        intensity: point.intensity,
        isTrail: true,
      }));

      return [...movedPointers, ...trailEffects];
    }

    return movedPointers;
  }

  resetMovedFlag() {
    this.pointers.forEach((pointer) => {
      if (!pointer.isBurst && !pointer.isTrail) {
        pointer.moved = false;
      }
    });
  }

  getRandomVanillaColor() {
    const randomIndex = Math.floor(Math.random() * this.vanillaColors.length);
    return [...this.vanillaColors[randomIndex]];
  }

  ensurePointerExists(index) {
    while (index >= this.pointers.length) {
      this.pointers.push(this.createPointer());
    }
  }

  findPointerById(id) {
    return this.pointers.find((pointer) => pointer.id === id);
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
        this.vanillaColors[Math.floor(time) % this.vanillaColors.length];
    }
  }
}
