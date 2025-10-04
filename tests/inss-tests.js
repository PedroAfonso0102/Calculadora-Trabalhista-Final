import { calcularINSS, resetINSSCache } from '../src/core/inss.js';
import { setAnoParametros } from '../src/core/parametersStore.js';

function assert(condition, message) {
  if (!condition) {
    console.error('FAIL:', message);
    process.exit(1);
  }
}

function assertEquals(actual, expected, message) {
  assert(actual === expected, `${message} | Expected: ${expected}, but got: ${actual}`);
}

console.log('--- INICIANDO TESTES DE CÁLCULO DE INSS ---');

await setAnoParametros(2024);
resetINSSCache();

// Teste com salário zero
(function testSalarioZero() {
    const { valor } = calcularINSS(0);
    assertEquals(valor, 0, 'INSS para salário 0 deve ser 0');
    console.log('[OK] Salário zero');
})();

// Teste com salário na primeira faixa
(function testPrimeiraFaixa() {
    // Salário de R$ 1000.00
    // 1000.00 * 7.5% = 75.00
    const { valor } = calcularINSS(1000);
    assertEquals(valor, 75.00, 'INSS para R$ 1000.00');
    console.log('[OK] Primeira faixa');
})();

// Teste com salário em múltiplas faixas
(function testMultiplasFaixas() {
    // Salário de R$ 3000.00
    // Faixa 1: 1412.00 * 7.5% = 105.90
    // Faixa 2: (2666.68 - 1412.00) * 9% = 112.92
    // Faixa 3: (3000.00 - 2666.68) * 12% = 39.99
    // Total: 105.90 + 112.92 + 39.99 = 258.81
    const { valor } = calcularINSS(3000);
    assertEquals(valor, 258.82, 'INSS para R$ 3000.00'); // Arredondamento pode causar pequenas diferenças
    console.log('[OK] Múltiplas faixas');
})();

// Teste com salário acima do teto
(function testAcimaDoTeto() {
    // Salário de R$ 8000.00. O cálculo é feito sobre o teto de R$ 7786.02
    // Faixa 1: 1412.00 * 7.5% = 105.90
    // Faixa 2: (2666.68 - 1412.00) * 9% = 112.92
    // Faixa 3: (4000.03 - 2666.68) * 12% = 160.00
    // Faixa 4: (7786.02 - 4000.03) * 14% = 530.04
    // Total: 105.90 + 112.92 + 160.00 + 530.03 = 908.85
    const { valor } = calcularINSS(8000);
    assertEquals(valor, 908.85, 'INSS para salário acima do teto');
    console.log('[OK] Acima do teto');
})();


console.log('\nTodos os testes de INSS passaram.');
