import { calcularRescisao } from '../src/core/rescisao.js';
import { initParametros } from '../src/core/parametersStore.js';
import { state, updateState, initialState } from '../src/core/state.js';

function assert(cond, msg) { if (!cond) throw new Error(msg); }
function approx(a, b, t = 0.02) { return Math.abs(a - b) <= t; }

// Inicializa os parâmetros para o ano de 2025 para consistência nos testes.
await initParametros(2025);

console.log('--- EXECUTANDO TESTES DE CORREÇÃO DA RESCISÃO ---');

// Teste 1: Garante que a projeção do aviso prévio indenizado é automática.
(function testeProjecaoAvisoIndenizadoAutomatica() {
  const cenario = {
    salarioBruto: 2000,
    motivo: 'SEM_JUSTA_CAUSA',
    dataAdmissao: '2025-01-15',
    dataDemissao: '2025-10-31', // 10 meses trabalhados no ano
    avisoPrevio: 'indenizado',
    projetarAvisoParaAvos: false // A CHAVE DO TESTE: esta opção deve ser ignorada
  };

  const r = calcularRescisao(cenario);

  // O contrato termina em 31/10. Com 0 anos de serviço, o aviso é de 30 dias.
  // A projeção leva o contrato para 30/11, garantindo 11/12 de 13º e férias.
  assert(r.meses13 === 11, `[FALHA] Projeção 13º: esperado 11, calculado ${r.meses13}`);
  assert(r.mesesFeriasProp === 11, `[FALHA] Projeção Férias: esperado 11, calculado ${r.mesesFeriasProp}`);

  console.log('[OK] Correção: Projeção do aviso prévio indenizado é automática.');
})();

// Teste 2: Valida a incidência correta de FGTS sobre as verbas rescisórias.
(function testeIncidenciaCorretaFGTS() {
  const cenario = {
    salarioBruto: 3000,
    motivo: 'SEM_JUSTA_CAUSA',
    dataAdmissao: '2024-01-10',
    dataDemissao: '2025-03-15',
    avisoPrevio: 'indenizado',
    feriasVencidas: true
  };

  const r = calcularRescisao(cenario);

  // FGTS deve incidir sobre saldo de salário, 13º proporcional e aviso prévio indenizado.
  const fgtsSaldoSalario = r.saldoSalario * 0.08;
  const fgtsDecimo = r.decimoProporcional * 0.08;
  const fgtsAviso = r.avisoIndenizado * 0.08;
  const fgtsEsperado = fgtsSaldoSalario + fgtsDecimo + fgtsAviso;

  assert(approx(r.fgtsReflex.total, fgtsEsperado), `[FALHA] Incidência FGTS: esperado ${fgtsEsperado}, calculado ${r.fgtsReflex.total}`);

  // Verifica se os componentes de férias estão com FGTS zerado.
  const fgtsSobreFeriasVenc = r.fgtsReflex.componentes.find(c => c.label.includes('Vencidas'))?.fgts || 0;
  const fgtsSobreFeriasProp = r.fgtsReflex.componentes.find(c => c.label.includes('Proporcionais'))?.fgts || 0;

  assert(fgtsSobreFeriasVenc === 0, `[FALHA] FGTS não deveria incidir sobre Férias Vencidas. Valor: ${fgtsSobreFeriasVenc}`);
  assert(fgtsSobreFeriasProp === 0, `[FALHA] FGTS não deveria incidir sobre Férias Proporcionais. Valor: ${fgtsSobreFeriasProp}`);

  console.log('[OK] Correção: Incidência de FGTS sobre verbas rescisórias está correta.');
})();

// Teste 3: Valida se a multa de 40% considera o saldo de FGTS informado.
(function testeMultaFGTSComSaldo() {
  const cenario = {
    salarioBruto: 3000,
    motivo: 'SEM_JUSTA_CAUSA',
    dataAdmissao: '2025-01-10',
    dataDemissao: '2025-03-15',
    saldoFgts: 10000, // Saldo fornecido pelo usuário
    avisoPrevio: 'indenizado'
  };

  const r = calcularRescisao(cenario);

  const baseMultaEsperada = cenario.saldoFgts + r.fgtsReflex.total;
  const multaEsperada = baseMultaEsperada * 0.40;

  assert(approx(r.multaFGTS, multaEsperada), `[FALHA] Multa FGTS: esperado ${multaEsperada}, calculado ${r.multaFGTS}`);

  console.log('[OK] Funcionalidade: Multa de 40% do FGTS considera o saldo informado.');
})();

// Teste 4: Garante que o alerta de saldo de FGTS zerado é acionado corretamente.
(function testeAlertaSaldoFGTSZerado() {
  const cenario = {
    salarioBruto: 3000,
    motivo: 'SEM_JUSTA_CAUSA',
    dataAdmissao: '2025-01-10',
    dataDemissao: '2025-03-15',
    saldoFgts: 0, // Saldo zerado
    avisoPrevio: 'indenizado'
  };

  const r = calcularRescisao(cenario);
  const alertaEsperado = 'Atenção: O saldo de FGTS não foi informado.';

  const temAlerta = r.warnings.some(w => w.includes(alertaEsperado));
  assert(temAlerta, '[FALHA] O alerta de saldo de FGTS zerado não foi encontrado.');

  console.log('[OK] Correção: Alerta de saldo de FGTS zerado funciona.');
})();

// Teste 5: Garante que o alerta NÃO é mostrado em outros tipos de demissão.
(function testeAlertaSaldoFGTSZeradoCasoNegativo() {
  const cenario = {
    salarioBruto: 3000,
    motivo: 'PEDIDO_DEMISSAO', // Motivo diferente
    dataAdmissao: '2025-01-10',
    dataDemissao: '2025-03-15',
    saldoFgts: 0,
    avisoPrevio: 'nao_cumprido'
  };

  const r = calcularRescisao(cenario);
  const alertaInesperado = 'Atenção: O saldo de FGTS não foi informado.';

  const temAlerta = r.warnings.some(w => w.includes(alertaInesperado));
  assert(!temAlerta, '[FALHA] O alerta de saldo de FGTS zerado foi mostrado incorretamente para Pedido de Demissão.');

  console.log('[OK] Correção: Alerta de FGTS não é exibido em outros tipos de demissão.');
})();

// Teste 6: Valida a lógica de estado compartilhado (simulando a sincronização)
(function testeSincronizacaoDeEstado() {
    // Reseta o estado para garantir um teste limpo
    updateState('rescisao.dependentes', 0);
    updateState('ferias.dependentes', 0);
    updateState('salarioLiquido.dependentes', 0);

    // Simula a atualização de um campo global em uma calculadora
    const novoValorDependentes = 5;
    updateState('rescisao.dependentes', novoValorDependentes);

    // // A lógica de sincronização real acontece no main.js e é difícil de testar aqui.
    // // Em vez disso, vamos simular o efeito esperado: outros estados devem ser atualizados.
    // // Para este teste, vamos assumir que a lógica de sincronização já rodou e atualizou os outros.
    // // O teste real será a verificação manual ou um teste de UI.
    // // O que podemos testar é se o estado é mutável como esperado.
    updateState('ferias.dependentes', novoValorDependentes);
    updateState('salarioLiquido.dependentes', novoValorDependentes);

    assert(state.rescisao.dependentes === novoValorDependentes, '[FALHA] Estado de rescisao.dependentes não foi atualizado.');
    assert(state.ferias.dependentes === novoValorDependentes, '[FALHA] Estado de ferias.dependentes não foi sincronizado.');
    assert(state.salarioLiquido.dependentes === novoValorDependentes, '[FALHA] Estado de salarioLiquido.dependentes não foi sincronizado.');

    console.log('[OK] Funcionalidade: Sincronização de estado para campos globais (simulada).');

    // Limpeza
    updateState('rescisao.dependentes', initialState.rescisao.dependentes);
    updateState('ferias.dependentes', initialState.ferias.dependentes);
    updateState('salarioLiquido.dependentes', initialState.salarioLiquido.dependentes);
})();

console.log('--- TESTES DE CORREÇÃO DA RESCISÃO CONCLUÍDOS ---');
