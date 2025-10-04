# ADR-0002: Escolha de Vanilla JS com Arquitetura Modular

**Data**: 2025-09-19
**Status**: Aceito

## Contexto

A aplicação "Calculadora Trabalhista" precisa de uma base de código leve, de rápida inicialização e com baixa sobrecarga de dependências. O objetivo principal é fornecer cálculos precisos e uma interface de usuário reativa sem a complexidade de um grande framework de frontend. A longevidade e a facilidade de manutenção com o mínimo de ferramentas de build também são cruciais.

## Decisão

Optou-se por desenvolver a aplicação utilizando **JavaScript puro (ES2022+)** e uma **arquitetura modular nativa**. A estrutura do código é claramente dividida em camadas (`core`, `ui`, `services`, `features`), promovendo baixo acoplamento e alta coesão.

- **`src/core`**: Contém a lógica de negócio pura, sem dependências da UI.
- **`src/ui`**: Responsável pela renderização e manipulação do DOM.
- **`src/app`**: Orquestra a comunicação entre as camadas.
- **Dependências**: As poucas dependências externas (como `jsPDF`) são carregadas dinamicamente via CDN para manter o bundle inicial o mais leve possível.

Esta abordagem maximiza a performance e a transparência do código, evitando a "caixa-preta" de frameworks.

## Consequências

- **Positivas**:
  - **Performance**: Tempo de carregamento e interação extremamente rápidos devido à ausência de um runtime de framework.
  - **Leveza**: O tamanho final da aplicação é mínimo.
  - **Controle Total**: Total controle sobre o ciclo de vida da aplicação, manipulação do DOM e gerenciamento de estado.
  - **Longevidade**: O código depende apenas de padrões da web (JavaScript e Módulos ES), tornando-o menos suscetível a se tornar obsoleto com a mudança de tendências de frameworks.
  - **Simplicidade de Build**: O processo de build é simplificado, focando apenas na transpilação de CSS com Tailwind.

- **Negativas**:
  - **Mais Código Manual**: Requer a implementação manual de funcionalidades que são fornecidas por padrão em frameworks (ex: gerenciamento de estado complexo, data-binding reativo).
  - **Curva de Aprendizagem**: Novos desenvolvedores acostumados com frameworks podem precisar de um tempo de adaptação para entender a arquitetura customizada e o fluxo de dados.

## Alternativas Consideradas

- **React/Vue/Svelte**:
  - **Prós**: Ecossistemas maduros, grande comunidade, muitas bibliotecas prontas. Facilitam o gerenciamento de estado e a reatividade da UI.
  - **Contras**: Adicionam uma camada de abstração significativa, aumentam o tamanho do bundle e a complexidade do processo de build. Para a complexidade atual da aplicação, seriam um exagero (`over-engineering`).
  - **Razão para não escolher**: O ganho em produtividade não compensaria a perda de performance e a simplicidade que o Vanilla JS oferece para este caso de uso específico.

## Critérios de Revisão Futura

Esta decisão deve ser revisitada se:
- A complexidade da interface de usuário aumentar a ponto de o gerenciamento manual do estado se tornar um gargalo de produtividade e fonte de bugs.
- A equipe de desenvolvimento crescer significativamente, e a padronização imposta por um framework se tornar mais valiosa.
- Surgirem requisitos de performance que não possam ser atendidos pela abordagem atual.
