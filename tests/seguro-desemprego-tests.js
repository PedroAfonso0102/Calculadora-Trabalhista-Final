import { calculateSeguroDesemprego } from '../src/core/calculations.js';
import { initParametros } from '../src/core/parametersStore.js';

function approx(a, b, tol = 0.01) {
    if (Math.abs(a - b) > tol) {
        throw new Error(`Valores divergentes: ${a} vs ${b}`);
    }
}

async function run() {
    console.log('Executando testes para a nova Calculadora de Seguro-Desemprego...');

    // Teste 1: Faixa 1
    const cenario1 = {
        salario1: 2000,
        salario2: 2000,
        salario3: 2000,
        mesesTrabalhados: 12,
        numeroSolicitacoes: 0,
    };
    const r1 = calculateSeguroDesemprego(cenario1);
    approx(r1.mediaSalarial, 2000);
    approx(r1.valorParcela, 1600); // 2000 * 0.8
    approx(r1.numeroParcelas, 4);
    console.log('[OK] Seguro-Desemprego: Faixa 1');

    // Teste 2: Faixa 2
    const cenario2 = {
        salario1: 3000,
        salario2: 3000,
        salario3: 3000,
        mesesTrabalhados: 24,
        numeroSolicitacoes: 1,
    };
    const r2 = calculateSeguroDesemprego(cenario2);
    approx(r2.mediaSalarial, 3000);
    approx(r2.valorParcela, 2141.63); // (3000 - 2138.76) * 0.5 + 1711.01
    approx(r2.numeroParcelas, 5);
    console.log('[OK] Seguro-Desemprego: Faixa 2');

    // Teste 3: Faixa 3 (Teto)
    const cenario3 = {
        salario1: 4000,
        salario2: 4000,
        salario3: 4000,
        mesesTrabalhados: 6,
        numeroSolicitacoes: 2,
    };
    const r3 = calculateSeguroDesemprego(cenario3);
    approx(r3.mediaSalarial, 4000);
    approx(r3.valorParcela, 2424.11); // Teto
    approx(r3.numeroParcelas, 3);
    console.log('[OK] Seguro-Desemprego: Faixa 3 (Teto)');

    // Teste 4: Salário Mínimo
    const cenario4 = {
        salario1: 1500,
        salario2: 1500,
        salario3: 1500,
        mesesTrabalhados: 12,
        numeroSolicitacoes: 0,
    };
    const r4 = calculateSeguroDesemprego(cenario4);
    approx(r4.mediaSalarial, 1500);
    approx(r4.valorParcela, 1518.00); // Salário Mínimo
    approx(r4.numeroParcelas, 4);
    console.log('[OK] Seguro-Desemprego: Salário Mínimo');

    console.log('Todos os testes de Seguro-Desemprego passaram.');
}

await initParametros(2025);
await run();
