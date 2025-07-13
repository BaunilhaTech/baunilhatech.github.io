/**
 * Fluid Effect Module
 *
 * Um efeito de simulação de fluidos interativo usando WebGL.
 * Pode ser usado em qualquer elemento canvas do site.
 *
 * @example
 * import { FluidEffect } from './effects/fluid';
 *
 * const canvas = document.querySelector('canvas');
 * const fluid = new FluidEffect(canvas);
 * fluid.start();
 */

export { FluidSimulation as FluidEffect } from "./fluid-simulation.js";

// Exporta também as configurações padrão para customização
export const defaultFluidConfig = {
  TEXTURE_DOWNSAMPLE: 1,
  DENSITY_DISSIPATION: 0.98,
  VELOCITY_DISSIPATION: 0.99,
  PRESSURE_DISSIPATION: 0.8,
  PRESSURE_ITERATIONS: 25,
  CURL: 30,
  SPLAT_RADIUS: 0.005,
};

/**
 * Função helper para criar rapidamente um efeito de fluido
 * @param {HTMLCanvasElement} canvas - O elemento canvas
 * @param {Object} config - Configurações opcionais
 * @returns {Promise<FluidEffect>} Instância do efeito de fluido
 */
export async function createFluidEffect(canvas, config = {}) {
  const { FluidSimulation } = await import("./fluid-simulation.js");
  const fluid = new FluidSimulation(canvas);

  // Aplica configurações customizadas se fornecidas
  if (Object.keys(config).length > 0) {
    Object.assign(fluid.config, config);
  }

  return fluid;
}
