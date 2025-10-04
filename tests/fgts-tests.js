import { calculateFGTS } from '../src/core/calculations.js';
import { initParametros } from '../src/core/parametersStore.js';

function approx(a, b, tol = 0.01) {
    if (Math.abs(a - b) > tol) {
        throw new Error(`Valores divergentes: ${a} vs ${b}`);
    }
}

async function run() {
    console.log('Executando testes para a nova Calculadora de FGTS...');

    // Teste 1: Cenário simples, 12 meses, sem saldo anterior
    const cenario1 = {
        salarioBruto: 2000,
        saldoFgts: 0,
        dataInicio: '01/2024',
        dataFim: '12/2024',
    };
    const r1 = calculateFGTS(cenario1);
    approx(r1.mesesContribuicao, 12);
    approx(r1.depositoMensal, 160);
    approx(r1.saldoFinalEstimado, 1920);
    if (r1.saldoComJuros <= r1.saldoFinalEstimado) {
        throw new Error('Juros não foram aplicados no cenário 1');
    }
    console.log('[OK] FGTS: Cenário simples (12 meses)');

    // Teste 2: Com saldo anterior
    const cenario2 = {
        salarioBruto: 3000,
        saldoFgts: 5000,
        dataInicio: '01/2025',
        dataFim: '06/2025',
    };
    const r2 = calculateFGTS(cenario2);
    approx(r2.mesesContribuicao, 6);
    approx(r2.depositoMensal, 240);
    approx(r2.saldoFinalEstimado, 5000 + (240 * 6));
     if (r2.saldoComJuros <= r2.saldoFinalEstimado) {
        throw new Error('Juros não foram aplicados no cenário 2');
    }
    console.log('[OK] FGTS: Cenário com saldo anterior');

    // Teste 3: Período curto (3 meses)
    const cenario3 = {
        salarioBruto: 1500,
        saldoFgts: 100,
        dataInicio: '03/2025',
        dataFim: '05/2025',
    };
    const r3 = calculateFGTS(cenario3);
    approx(r3.mesesContribuicao, 3);
    approx(r3.depositoMensal, 120);
    approx(r3.saldoFinalEstimado, 100 + (120 * 3));
    if (r3.saldoComJuros <= r3.saldoFinalEstimado) {
        throw new Error('Juros não foram aplicados no cenário 3');
    }
    console.log('[OK] FGTS: Período curto');

    // Teste 4: Validação de período inválido
    const cenario4 = {
        salarioBruto: 2000,
        saldoFgts: 0,
        dataInicio: '12/2024',
        dataFim: '01/2024',
    };
    const r4 = calculateFGTS(cenario4);
    if (!r4.warnings || r4.warnings.length === 0) {
        throw new Error('Deveria ter retornado um aviso para período inválido');
    }
    console.log('[OK] FGTS: Validação de período inválido');

    console.log('Todos os testes de FGTS passaram.');
}

await initParametros(2025);
await run();
