# Effects Module

Módulo de efeitos visuais reutilizáveis para o site Baunilha.

## Estrutura

```
src/effects/
├── index.js              # Ponto de entrada principal
├── fluid/                # Efeito de simulação de fluidos
│   ├── index.js          # Exportações do efeito de fluido
│   ├── fluid-simulation.js
│   ├── webgl-context.js
│   ├── gl-program.js
│   ├── framebuffer.js
│   └── pointer-manager.js
└── README.md             # Este arquivo
```

## Como Usar

### Importação Simples (Recomendado)

```javascript
import { FluidEffect } from "./effects/fluid";

const canvas = document.querySelector("canvas");
const fluid = new FluidEffect(canvas);
fluid.start();
```

### Importação com Configuração Custom

```javascript
import { createFluidEffect, defaultFluidConfig } from "./effects/fluid";

const canvas = document.querySelector("canvas");
const customConfig = {
  ...defaultFluidConfig,
  CURL: 50, // Mais turbulência
  SPLAT_RADIUS: 0.01, // Splats maiores
  DENSITY_DISSIPATION: 0.95, // Dissipação mais lenta
};

const fluid = await createFluidEffect(canvas, customConfig);
fluid.start();
```

### Factory Pattern (Para uso dinâmico)

```javascript
import { createEffect, EffectTypes } from "./effects";

const canvas = document.querySelector("canvas");
const effect = await createEffect(EffectTypes.FLUID, canvas);
effect.start();
```

## Configurações do Efeito de Fluido

| Propriedade            | Padrão | Descrição                                  |
| ---------------------- | ------ | ------------------------------------------ |
| `TEXTURE_DOWNSAMPLE`   | 1      | Redução de resolução (1 = resolução total) |
| `DENSITY_DISSIPATION`  | 0.98   | Taxa de dissipação da densidade (0-1)      |
| `VELOCITY_DISSIPATION` | 0.99   | Taxa de dissipação da velocidade (0-1)     |
| `PRESSURE_DISSIPATION` | 0.8    | Taxa de dissipação da pressão (0-1)        |
| `PRESSURE_ITERATIONS`  | 25     | Iterações do solver de pressão             |
| `CURL`                 | 30     | Força do curl (turbulência)                |
| `SPLAT_RADIUS`         | 0.005  | Raio dos splats de interação               |

## Adicionando Novos Efeitos

1. Crie uma nova pasta em `src/effects/novo-efeito/`
2. Implemente o efeito com um `index.js` exportando:
   - Classe principal do efeito
   - Configurações padrão
   - Função helper de criação
3. Adicione as exportações em `src/effects/index.js`
4. Atualize o enum `EffectTypes`
5. Adicione um case na função `createEffect`

### Exemplo de Estrutura para Novo Efeito

```javascript
// src/effects/particles/index.js
export { ParticleSystem as ParticleEffect } from "./particle-system.js";
export const defaultParticleConfig = {
  /* ... */
};
export function createParticleEffect(canvas, config = {}) {
  /* ... */
}
```

## Reutilização

Este módulo foi projetado para ser reutilizado em diferentes partes do site:

```javascript
// Em uma página específica
import { FluidEffect } from "../effects/fluid";

// Em um componente
import { createEffect, EffectTypes } from "../effects";

// Em qualquer lugar do site
const effect = await createEffect(EffectTypes.FLUID, canvasElement);
```
