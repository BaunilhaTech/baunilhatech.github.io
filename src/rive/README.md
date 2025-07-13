# Guia de Integração Rive

## Visão Geral

Esta implementação integra animações Rive no projeto web seguindo as melhores práticas da documentação oficial. A animação é carregada dinamicamente e gerenciada de forma eficiente.

## Estrutura da Implementação

### 1. Módulo RiveAnimation (`src/rive/index.js`)

Classe responsável por gerenciar o ciclo de vida das animações Rive:

**Características principais:**

- Inicialização automática da animação
- Redimensionamento responsivo
- Cleanup adequado de recursos
- Suporte a State Machines
- Tratamento de erros

**Métodos disponíveis:**

- `initialize()` - Inicializa a animação
- `play()` - Reproduz a animação
- `pause()` - Pausa a animação
- `stop()` - Para a animação
- `cleanup()` - Limpa recursos da memória
- `getStateMachineInputs()` - Obtém inputs de state machine

### 2. Seção HTML

Nova seção `#experience` criada com:

- Canvas dedicado para a animação Rive
- Layout responsivo (grid 2 colunas / 1 coluna mobile)
- Estilos modernos com efeitos hover

### 3. Integração no main.js

- Carregamento automático da animação
- Cleanup no beforeunload
- Tratamento de erros

## Como Usar

### Adicionar Nova Animação Rive

1. **Exporte sua animação** do Rive Editor como `.riv`
2. **Coloque o arquivo** na pasta `public/`
3. **Crie uma nova instância**:

```javascript
const novaAnimacao = new RiveAnimation(canvas, "/nova-animacao.riv", {
  autoplay: true,
  stateMachines: "Nome do State Machine", // opcional
});

novaAnimacao.initialize();
```

### Trabalhar com State Machines

Se sua animação tiver State Machines interativos:

```javascript
const animacao = new RiveAnimation(canvas, "/animacao.riv", {
  autoplay: true,
  stateMachines: "Interactive SM",
});

await animacao.initialize();

// Obter inputs do State Machine
const inputs = animacao.getStateMachineInputs("Interactive SM");

// Controlar inputs (exemplo)
if (inputs) {
  const hoverInput = inputs.find((i) => i.name === "Hover");
  if (hoverInput) {
    canvas.addEventListener("mouseenter", () => {
      hoverInput.value = true;
    });

    canvas.addEventListener("mouseleave", () => {
      hoverInput.value = false;
    });
  }
}
```

### Responsividade

A implementação já inclui:

- Redimensionamento automático do canvas
- Layout responsivo para mobile
- Otimizações de performance

## Melhores Práticas

### 1. Performance

- Sempre chame `cleanup()` quando a animação não for mais necessária
- Use `autoplay: false` se a animação só deve tocar quando visível
- Considere lazy loading para animações não críticas

### 2. Assets

- Mantenha arquivos `.riv` otimizados e pequenos
- Teste em diferentes resoluções de tela
- Use compressão quando possível

### 3. Accessibility

- Adicione `aria-label` aos canvas quando necessário
- Respeite `prefers-reduced-motion` para usuários sensíveis a movimento
- Forneça alternativas para usuários com JavaScript desabilitado

## Exemplo de Implementação com Intersection Observer

Para melhor performance, você pode carregar a animação apenas quando ela entra no viewport:

```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting && !riveAnimation) {
      // Inicializar animação apenas quando visível
      riveAnimation = new RiveAnimation(riveCanvas, "/experimental_ui.riv");
      riveAnimation.initialize();
    }
  });
});

observer.observe(riveCanvas);
```

## Solução de Problemas

### Animação não carrega

1. Verifique se o arquivo `.riv` está na pasta `public/`
2. Confirme se o caminho no código está correto
3. Verifique o console do navegador para erros

### Performance baixa

1. Reduza o tamanho do canvas
2. Otimize o arquivo `.riv` no Rive Editor
3. Use `autoplay: false` e controle manualmente

### Responsividade

1. Verifique se `resizeDrawingSurfaceToCanvas()` está sendo chamado
2. Confirme se os estilos CSS estão aplicados corretamente
3. Teste em diferentes tamanhos de tela

## Recursos Adicionais

- [Documentação oficial do Rive](https://rive.app/docs/runtimes/web/web-js)
- [Exemplos no GitHub](https://github.com/rive-app/rive-wasm/tree/master/js/examples)
- [Canal do Rive no YouTube](https://youtube.com/playlist?list=PLujDTZWVDSsFGonP9kzAnvryowW098-p3)
