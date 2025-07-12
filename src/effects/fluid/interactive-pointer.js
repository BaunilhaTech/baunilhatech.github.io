/**
 * Interactive Pointer Manager
 * 
 * Gerencia interações avançadas do mouse/touch com cores dinâmicas,
 * efeitos de movimento contínuo e interações especiais.
 */

export class InteractivePointerManager {
  constructor() {
    this.mouseTrail = [];
    this.maxTrailLength = 10;
    this.lastMouseTime = 0;
    this.mouseMoveThreshold = 2; // movimento mínimo para criar efeito
    
    // Paleta de cores baunilha em formato RGB normalizado
    this.vanillaColors = [
      [0.957, 0.816, 0.247], // #f4d03f - dourado principal
      [0.831, 0.647, 0.455], // #d4a574 - baunilha escura
      [0.910, 0.773, 0.278], // #e8c547 - baunilha quente
      [0.980, 0.941, 0.902], // #faf0e6 - creme claro
      [1.000, 0.843, 0.000], // #ffd700 - dourado puro
      [0.855, 0.647, 0.125], // #daa520 - dourado escuro
    ];
    
    this.currentColorIndex = 0;
    this.colorTransition = 0;
    
    // Inicializa os pointers DEPOIS das cores
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
    const pointer = this.pointers[0];
    const currentTime = Date.now();
    
    // Calcula posição relativa ao canvas
    const newX = event.clientX - canvasRect.left;
    const newY = event.clientY - canvasRect.top;
    
    // Calcula velocidade do movimento
    const deltaX = newX - pointer.x;
    const deltaY = newY - pointer.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const timeDelta = currentTime - this.lastMouseTime;
    
    if (timeDelta > 0) {
      pointer.velocity = distance / timeDelta * 100; // normaliza velocidade
    }
    
    // Atualiza posição
    pointer.lastX = pointer.x;
    pointer.lastY = pointer.y;
    pointer.x = newX;
    pointer.y = newY;
    pointer.dx = deltaX * 8.0; // amplifica movimento para efeito mais visível
    pointer.dy = deltaY * 8.0;
    
    // Define se deve criar efeito baseado no movimento
    pointer.moved = distance > this.mouseMoveThreshold;
    
    // Atualiza cor baseada na velocidade e posição
    this.updateColorBasedOnMovement(pointer, currentTime);
    
    // Atualiza intensidade baseada na velocidade
    pointer.intensity = Math.min(pointer.velocity / 50, 2.0); // max intensidade = 2
    
    // Adiciona ao trail
    this.updateMouseTrail(pointer);
    
    this.lastMouseTime = currentTime;
  }

  updateColorBasedOnMovement(pointer, currentTime) {
    // Muda cor baseada na velocidade
    const velocityFactor = Math.min(pointer.velocity / 100, 1.0);
    
    // Ciclo de cores mais suave baseado no tempo e movimento
    const timeFactor = (currentTime * 0.001) % (this.vanillaColors.length * 2);
    const colorIndex = Math.floor(timeFactor) % this.vanillaColors.length;
    const nextColorIndex = (colorIndex + 1) % this.vanillaColors.length;
    
    // Interpola entre cores
    const t = (timeFactor % 1) * velocityFactor;
    const currentColor = this.vanillaColors[colorIndex];
    const nextColor = this.vanillaColors[nextColorIndex];
    
    pointer.color = [
      currentColor[0] * (1 - t) + nextColor[0] * t,
      currentColor[1] * (1 - t) + nextColor[1] * t,
      currentColor[2] * (1 - t) + nextColor[2] * t,
    ];
    
    // Aumenta saturação com movimento rápido
    if (velocityFactor > 0.5) {
      pointer.color = pointer.color.map(c => Math.min(c * 1.2, 1.0));
    }
  }

  updateMouseTrail(pointer) {
    // Adiciona posição atual ao trail
    pointer.trail.push({
      x: pointer.x,
      y: pointer.y,
      time: Date.now(),
      intensity: pointer.intensity * 0.3, // trail mais sutil
    });
    
    // Remove pontos antigos do trail
    const maxAge = 200; // ms
    const currentTime = Date.now();
    pointer.trail = pointer.trail.filter(point => 
      currentTime - point.time < maxAge
    );
    
    // Limita tamanho do trail
    if (pointer.trail.length > this.maxTrailLength) {
      pointer.trail = pointer.trail.slice(-this.maxTrailLength);
    }
  }

  handleMouseDown(event, canvasRect) {
    const pointer = this.pointers[0];
    pointer.down = true;
    
    // Cor especial para clique - dourado mais vibrante
    pointer.color = [1.0, 0.843, 0.0]; // dourado puro
    pointer.intensity = 3.0; // intensidade máxima para clique
    
    // Cria burst effect no clique
    this.createClickBurst(pointer);
  }

  createClickBurst(pointer) {
    // Cria múltiplos splats em círculo para efeito de explosão
    const burstCount = 8;
    const burstRadius = 50;
    
    for (let i = 0; i < burstCount; i++) {
      const angle = (i / burstCount) * Math.PI * 2;
      const offsetX = Math.cos(angle) * burstRadius;
      const offsetY = Math.sin(angle) * burstRadius;
      
      // Adiciona ponto de burst à lista de efeitos
      this.pointers.push({
        ...this.createPointer(),
        x: pointer.x + offsetX,
        y: pointer.y + offsetY,
        dx: offsetX * 0.5,
        dy: offsetY * 0.5,
        moved: true,
        color: [1.0, 0.843, 0.0], // dourado
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
      
      // Calcula posição relativa ao canvas
      const newX = touch.clientX - canvasRect.left;
      const newY = touch.clientY - canvasRect.top;
      
      // Calcula velocidade do movimento
      const deltaX = newX - pointer.x;
      const deltaY = newY - pointer.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const timeDelta = currentTime - this.lastMouseTime;
      
      if (timeDelta > 0) {
        pointer.velocity = distance / timeDelta * 100;
      }
      
      // Atualiza posição
      pointer.lastX = pointer.x;
      pointer.lastY = pointer.y;
      pointer.x = newX;
      pointer.y = newY;
      pointer.dx = deltaX * 8.0;
      pointer.dy = deltaY * 8.0;
      
      // Define se deve criar efeito
      pointer.moved = distance > this.mouseMoveThreshold;
      
      // Atualiza cor e intensidade
      this.updateColorBasedOnMovement(pointer, currentTime);
      pointer.intensity = Math.min(pointer.velocity / 50, 2.0);
      
      // Atualiza trail
      this.updateMouseTrail(pointer);
    }
    
    this.lastMouseTime = currentTime;
  }

  updateBurstEffects() {
    // Atualiza e remove efeitos de burst
    this.pointers = this.pointers.filter(pointer => {
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
    
    // Retorna ponteiros movidos + trail effects
    const movedPointers = this.pointers.filter(pointer => pointer.moved);
    
    // Adiciona efeitos de trail para movimento contínuo
    const mainPointer = this.pointers[0];
    if (mainPointer.trail.length > 1) {
      const trailEffects = mainPointer.trail.slice(-3).map((point, index) => ({
        x: point.x,
        y: point.y,
        dx: 0,
        dy: 0,
        moved: true,
        color: mainPointer.color.map(c => c * (0.3 + index * 0.2)),
        intensity: point.intensity,
        isTrail: true,
      }));
      
      return [...movedPointers, ...trailEffects];
    }
    
    return movedPointers;
  }

  resetMovedFlag() {
    this.pointers.forEach(pointer => {
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
    return this.pointers.find(pointer => pointer.id === id);
  }

  // Método para criar movimento automático quando mouse está parado
  createIdleAnimation() {
    const pointer = this.pointers[0];
    const currentTime = Date.now();
    
    // Se mouse não se moveu por um tempo, cria movimento sutil
    if (currentTime - this.lastMouseTime > 2000 && !pointer.down) {
      const time = currentTime * 0.001;
      const waveX = Math.sin(time * 0.5) * 2;
      const waveY = Math.cos(time * 0.3) * 2;
      
      pointer.dx = waveX;
      pointer.dy = waveY;
      pointer.moved = true;
      pointer.intensity = 0.2;
      pointer.color = this.vanillaColors[Math.floor(time) % this.vanillaColors.length];
    }
  }
}
