export class PointerManager {
  constructor() {
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
      color: [30, 0, 300],
    };
  }

  updateMousePosition(event) {
    const pointer = this.pointers[0];
    pointer.moved = pointer.down;
    pointer.dx = (event.offsetX - pointer.x) * 10.0;
    pointer.dy = (event.offsetY - pointer.y) * 10.0;
    pointer.x = event.offsetX;
    pointer.y = event.offsetY;
  }

  updateTouchPositions(touches) {
    for (let i = 0; i < touches.length; i++) {
      this.ensurePointerExists(i);

      const pointer = this.pointers[i];
      pointer.moved = pointer.down;
      pointer.dx = (touches[i].pageX - pointer.x) * 10.0;
      pointer.dy = (touches[i].pageY - pointer.y) * 10.0;
      pointer.x = touches[i].pageX;
      pointer.y = touches[i].pageY;
    }
  }

  handleMouseDown() {
    const pointer = this.pointers[0];
    pointer.down = true;
    pointer.color = this.generateRandomColor();
  }

  handleTouchStart(touches) {
    for (let i = 0; i < touches.length; i++) {
      this.ensurePointerExists(i);

      const pointer = this.pointers[i];
      pointer.id = touches[i].identifier;
      pointer.down = true;
      pointer.x = touches[i].pageX;
      pointer.y = touches[i].pageY;
      pointer.color = this.generateRandomColor();
    }
  }

  handleMouseUp() {
    this.pointers[0].down = false;
  }

  handleTouchEnd(changedTouches) {
    for (let i = 0; i < changedTouches.length; i++) {
      const touchId = changedTouches[i].identifier;
      const pointer = this.findPointerById(touchId);

      if (pointer) {
        pointer.down = false;
      }
    }
  }

  getMovedPointers() {
    return this.pointers.filter((pointer) => pointer.moved);
  }

  resetMovedFlag() {
    this.pointers.forEach((pointer) => {
      pointer.moved = false;
    });
  }

  ensurePointerExists(index) {
    if (index >= this.pointers.length) {
      this.pointers.push(this.createPointer());
    }
  }

  findPointerById(id) {
    return this.pointers.find((pointer) => pointer.id === id);
  }

  generateRandomColor() {
    return [Math.random() + 0.2, Math.random() + 0.2, Math.random() + 0.2];
  }
}
