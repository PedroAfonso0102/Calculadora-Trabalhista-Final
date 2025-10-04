# ADR-0003: Adoção de Classes de Utilitário Semânticas para Theming

**Data**: 2025-09-19
**Status**: Aceito

## Contexto

A interface da aplicação estava utilizando classes de utilitário do TailwindCSS diretamente no HTML, como `bg-white`, `text-gray-800`, `border-gray-200`. Essa abordagem apresentava problemas:

1.  **Acoplamento Visual**: O código estava acoplado a cores específicas, dificultando a implementação de um modo escuro (dark mode) consistente.
2.  **Manutenção Difícil**: Alterar uma cor de base (ex: o tom de cinza para bordas) exigiria uma busca e substituição em múltiplos locais, com alto risco de inconsistência.
3.  **Falta de Semântica**: As classes descreviam a aparência (`como é`), mas não a função do elemento (`o que é`).

## Decisão

Foi decidido refatorar o CSS para usar um sistema de **classes de utilitário semânticas**. Em vez de aplicar cores diretamente, aplicamos classes que representam a função da superfície ou do texto.

**Exemplos de Novas Classes:**
-   `bg-surface`, `bg-subtle`, `bg-elevated` (para fundos)
-   `text-default`, `text-muted`, `text-subtle` (para textos)
-   `border-default` (para bordas)

Essas classes são definidas em `assets/css/style.css` e mapeiam para variáveis de cor (CSS Custom Properties) definidas em `:root` e sobrescritas em `.dark`.

```css
:root {
  --color-surface: 210 40% 98%; /* hsl(210, 40%, 98%) */
  --color-text-default: 215 25% 27%;
}
.dark {
  --color-surface: 215 28% 17%;
  --color-text-default: 210 40% 98%;
}

.bg-surface {
  background-color: hsl(var(--color-surface));
}
.text-default {
  color: hsl(var(--color-text-default));
}
```

## Consequências

- **Positivas**:
  - **Theming Simplificado**: A implementação do dark mode tornou-se trivial. Basta definir as variáveis de cor no seletor `.dark`.
  - **Manutenção Centralizada**: Para alterar uma cor em todo o site, basta alterar uma variável de CSS em um único lugar.
  - **Código Mais Limpo e Semântico**: O HTML agora descreve a intenção (`card-base`, `text-muted`) em vez da implementação visual, tornando o markup mais legível e resiliente a mudanças de design.
  - **Consistência Visual**: Garante que os mesmos tons e superfícies sejam usados de forma consistente em toda a aplicação.

- **Negativas**:
  - **Curva de Aprendizagem**: Desenvolvedores precisam aprender o novo conjunto de classes semânticas em vez de usar as classes do Tailwind diretamente.
  - **Abstração Adicional**: Adiciona uma pequena camada de abstração sobre o TailwindCSS.

## Alternativas Consideradas

- **Manter Classes de Tailwind com Prefixo `dark:`**:
  - **Prós**: Utiliza uma funcionalidade nativa do Tailwind.
  - **Contras**: Leva a um HTML muito poluído (`class="bg-white dark:bg-gray-800 text-gray-900 dark:text-white..."`), tornando-o difícil de ler e manter. A lógica do tema fica espalhada por todo o código, em vez de centralizada.
  - **Razão para não escolher**: A complexidade e a falta de manutenibilidade do HTML superam os benefícios de usar a abordagem nativa do Tailwind para este caso.

## Critérios de Revisão Futura

Esta abordagem deve ser mantida enquanto a aplicação suportar um número limitado e bem definido de temas (ex: claro e escuro). Se a necessidade de temas dinâmicos ou customizáveis pelo usuário se tornar um requisito, uma solução mais robusta (como a aplicação de estilos via JavaScript com base nas configurações) pode ser necessária.
