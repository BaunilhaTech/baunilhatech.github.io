import { FluidSimulation } from "./fluid-simulation.js";
import { DarkInteractivePointerManager } from "./interactive-pointer-dark.js";

export class FooterFluidSimulation extends FluidSimulation {
  constructor(canvas) {
    super(canvas);

    // Substitui o gerenciador de ponteiros após a inicialização completa
    this.pointerManager = new DarkInteractivePointerManager();

    // Configura parâmetros mais sutis para o footer
    this.config = {
      ...this.config,
      DENSITY_DISSIPATION: 0.995,
      VELOCITY_DISSIPATION: 0.992,
      PRESSURE_DISSIPATION: 0.85,
      PRESSURE_ITERATIONS: 20,
      CURL: 15,
      SPLAT_RADIUS: 0.003,
    };

    // Reconecta os event listeners com o novo gerenciador
    this.setupEventListeners();
  }
}
