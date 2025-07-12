---
applyTo: "**"
---

## Contexto do Projeto

Este projeto utiliza uma stack moderna para desenvolvimento de websites estáticos:

- **Build Tool**: Vite
- **Gerenciador de Pacotes**: pnpm
- **Linguagens**: HTML5, CSS3, e JavaScript (ESM) puro (vanilla).
- **Estrutura**: O código-fonte está em `src/`. O ponto de entrada do JS é `src/main.js`. O CSS principal é `src/style.css`.

## Diretrizes Gerais

- **Foco em Performance e Boas Práticas**: Priorize código limpo, semântico e performático.
- **Não use Frameworks**: Não sugira soluções baseadas em React, Vue, Angular ou qualquer outro framework de UI. O projeto é estritamente vanilla.
- **Siga a Estrutura do Vite**: Respeite a estrutura de pastas e o sistema de módulos do Vite. Recursos devem ser importados e processados, não linkados de forma estática, a menos que estejam na pasta `public/`.

## Princípios Fundamentais de Geração de Código

Antes de gerar qualquer código, siga estritamente os seguintes princípios:

1.  **Analisar o Contexto Atual**: Sempre leia e avalie o código existente no arquivo atual. Suas sugestões devem ser consistentes com os padrões, variáveis e lógica já implementados. Não sugira código que conflite com o contexto.
2.  **Priorizar a Documentação Oficial**: Baseie suas sugestões nas práticas recomendadas e nas APIs mais recentes. Em caso de dúvida, consulte a documentação oficial (MDN para Web APIs, ViteJS.dev, etc.) para evitar o uso de código obsoleto ou desaconselhado.
3.  **Seguir os Princípios de "Object Calisthenics"**: Priorize soluções simples, legíveis e funcionais, aplicando as seguintes regras:
    - **Um Nível de Indentação por Função**: Evite aninhar `if`, `for`, `while`, etc. Se precisar de mais um nível, extraia a lógica para uma nova função.
    - **Não Use a Cláusula `else`**: Prefira usar "guard clauses" (retornos antecipados) para lidar com casos alternativos no início da função. Isso torna o caminho principal do código mais claro e linear.
    - **Não Abreviar**: Use nomes de variáveis e funções completos e descritivos. Escreva `const userProfile` em vez de `const usrPrf`. A clareza é mais importante que a brevidade.
    - **Mantenha Funções e Arquivos Pequenos**: Cada função deve ter uma única e clara responsabilidade. Cada arquivo deve agrupar um conjunto coeso de funcionalidades relacionadas.
    - **Evite Encadeamentos Longos (Um Ponto por Linha)**: Evite cadeias como `objeto.propriedade1.propriedade2.metodo()`. Desestruture ou armazene valores intermediários em constantes para melhorar a legibilidade e reduzir o acoplamento.

### Estilo de Código e Convenções

#### HTML

- **Semântica Acima de Tudo**: Use tags HTML5 semânticas (`<header>`, `<main>`, `<nav>`, `<section>`, `<footer>`, `<article>`, etc.).
- **Acessibilidade (a11y)**: Sempre inclua atributos `alt` em imagens e use atributos `aria-*` quando a semântica do HTML não for suficiente.

#### CSS

- **Variáveis CSS**: Defina e utilize variáveis CSS (`:root { --cor-primaria: #...; }`) para cores, fontes e espaçamentos. Isso é mandatório para manter a consistência.
- **Metodologia BEM**: Ao criar novos componentes, siga a convenção BEM (Block**Element--Modifier) para nomear as classes. Ex: `.card**title--featured`.
- **Importação via JS**: Lembre-se que o CSS principal é importado via JavaScript em `src/main.js` (`import './style.css';`).

#### JavaScript

- **Módulos ESM**: Todo o código JS deve ser modular. Use `import` e `export`. Evite poluir o escopo global.
- **Moderno e Vanilla**: Utilize funcionalidades do ES6+ como `const`/`let`, arrow functions, template literals e `async/await`.
- **Manipulação do DOM**:
  - Selecione elementos de forma eficiente com `document.querySelector` e `document.querySelectorAll`.
  - Armazene seleções de elementos em constantes se forem usadas mais de uma vez.
  - Para adicionar múltiplos elementos, use `DocumentFragment` para evitar reflows excessivos.
- **Requisições de API**: Use a API `Fetch` com `async/await` para todas as chamadas de rede.

### Otimização de Performance

- **Vite cuida do build**: Não se preocupe com minificação ou bundling, o Vite faz isso no comando `pnpm build`.
- **Foco na Otimização de Assets**:
  - Ao sugerir imagens, mencione a importância de usar formatos modernos como WebP.
  - Para imagens "abaixo da dobra", sempre adicione o atributo `loading="lazy"`.
