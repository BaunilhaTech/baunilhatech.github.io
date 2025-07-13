import { Rive } from "@rive-app/canvas";

export class RiveAnimation {
  constructor(canvasElement, riveFilePath, options = {}) {
    this.canvasElement = canvasElement;
    this.riveFilePath = riveFilePath;
    this.riveInstance = null;
    this.options = {
      autoplay: true,
      stateMachines: options.stateMachines || null,
      artboard: options.artboard || null,
      ...options,
    };

    this.handleResize = this.handleResize.bind(this);
  }

  async initialize() {
    if (!this.canvasElement) {
      throw new Error("Canvas element is required for Rive animation");
    }

    try {
      this.riveInstance = new Rive({
        src: this.riveFilePath,
        canvas: this.canvasElement,
        autoplay: this.options.autoplay,
        artboard: this.options.artboard,
        stateMachines: this.options.stateMachines,
        onLoad: () => {
          this.handleLoad();
        },
        onLoadError: (error) => {
          console.error("Erro ao carregar animação Rive:", error);
        },
      });

      // Adicionar listener para resize da janela
      window.addEventListener("resize", this.handleResize);

      return this.riveInstance;
    } catch (error) {
      console.error("Erro ao inicializar animação Rive:", error);
      throw error;
    }
  }

  handleLoad() {
    if (!this.riveInstance) {
      return;
    }

    // Garantir que a superfície de desenho corresponda ao tamanho do canvas
    this.riveInstance.resizeDrawingSurfaceToCanvas();
  }

  handleResize() {
    if (!this.riveInstance) {
      return;
    }

    // Reajustar a superfície de renderização quando a janela é redimensionada
    this.riveInstance.resizeDrawingSurfaceToCanvas();
  }

  play() {
    if (!this.riveInstance) {
      return;
    }

    this.riveInstance.play();
  }

  pause() {
    if (!this.riveInstance) {
      return;
    }

    this.riveInstance.pause();
  }

  stop() {
    if (!this.riveInstance) {
      return;
    }

    this.riveInstance.stop();
  }

  cleanup() {
    if (this.riveInstance) {
      this.riveInstance.cleanup();
      this.riveInstance = null;
    }

    window.removeEventListener("resize", this.handleResize);
  }

  // Método para obter inputs de state machine (se houver)
  getStateMachineInputs(stateMachineName) {
    if (!this.riveInstance) {
      return null;
    }

    return this.riveInstance.stateMachineInputs(stateMachineName);
  }
}
