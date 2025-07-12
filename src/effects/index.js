/**
 * Effects Module
 *
 * Módulo central para todos os efeitos visuais do site.
 * Facilita a importação e uso dos diferentes efeitos disponíveis.
 */

// Efeito de Fluido
export {
  FluidEffect,
  defaultFluidConfig,
  createFluidEffect,
} from "./fluid/index.js";

// Adicione outros efeitos aqui no futuro:
// export { ParticleEffect } from './particles/index.js';
// export { WaveEffect } from './waves/index.js';
// export { NoiseEffect } from './noise/index.js';

/**
 * Enum com todos os tipos de efeitos disponíveis
 */
export const EffectTypes = {
  FLUID: "fluid",
  // PARTICLES: 'particles',
  // WAVES: 'waves',
  // NOISE: 'noise',
};

/**
 * Factory function para criar efeitos dinamicamente
 * @param {string} type - Tipo do efeito (use EffectTypes)
 * @param {HTMLCanvasElement} canvas - Elemento canvas
 * @param {Object} config - Configurações do efeito
 * @returns {Promise<Object>} Instância do efeito
 */
export async function createEffect(type, canvas, config = {}) {
  switch (type) {
    case EffectTypes.FLUID:
      const { createFluidEffect } = await import("./fluid/index.js");
      return createFluidEffect(canvas, config);

    // Adicione outros casos aqui:
    // case EffectTypes.PARTICLES:
    //   const { createParticleEffect } = await import('./particles/index.js');
    //   return createParticleEffect(canvas, config);

    default:
      throw new Error(`Effect type "${type}" not found`);
  }
}
