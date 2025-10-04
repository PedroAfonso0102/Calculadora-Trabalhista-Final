# Calculadora Trabalhista

Aplicação web modular para simulação de cálculos trabalhistas.

Resumo
-------
- Suporta cálculos de férias, rescisão, 13º, salário líquido e tributos relacionados (INSS, IRRF, FGTS, PIS/PASEP, seguro-desemprego).
- Parâmetros por ano (2020–2025) para comparar regras vigentes.
- Exportação de resultados para PDF e persistência local de preferências.

Pré-requisitos
-------------
- Node.js v18+ e npm

Instalação e execução
---------------------
1. Clone o repositório e acesse a pasta do projeto:

```powershell
git clone https://github.com/PedroAfonso0102/Calculadora-Trabalhista-Final.git
cd calculadora-trabalhista
```

2. Instale dependências:

```powershell
npm install
```

3. Compile os estilos (produção):

```powershell
npm run build:css
```

4. Para desenvolvimento (watch):

```powershell
npm run dev:css
```

5. Abra `index.html` no navegador.

Observação: não é necessário um servidor complexo para uso local; entretanto, para rotas ou APIs locais use um servidor estático simples (por exemplo, `npx serve`).

Principais arquivos e organização
--------------------------------
- `src/core/` — lógica de cálculo e regras legais.
- `src/app/` — inicialização e orquestração da aplicação.
- `src/ui/` — componentes e renderização do DOM.
- `src/services/` — utilitários: formatação, PDF, armazenamento local.
- `data/` — parâmetros por ano, textos e base de conhecimento.
- `tests/` — scripts de teste automatizados.

Build e documentação
---------------------
- Estilos: TailwindCSS com PostCSS (scripts em `package.json`).
- Documentação do código com JSDoc. Recomenda-se usar npx para evitar instalação global:

```powershell
npx jsdoc src -r -d ./docs/jsdoc
```

Testes
------
Os testes estão em `tests/` e podem ser executados usando Node.js conforme os scripts ou instruções internas dos arquivos de teste. Exemplo genérico:

```powershell
node tests/run-tests.js
```

Contribuição
------------
- Fork > branch de feature > PR com descrição clara das mudanças.
- Mantenha a documentação atualizada para mudanças em regras ou parâmetros.

Licença
-------
Licenciado sob MIT. Consulte o arquivo `LICENSE`.

Referências
----------
- Parâmetros e dados estão em `data/` (arquivos `parametros-*.js` e JSONs).
- Decisões de arquitetura em `docs/adr/`.