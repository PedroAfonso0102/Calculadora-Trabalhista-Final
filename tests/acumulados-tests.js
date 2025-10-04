import { initParametros } from '../src/core/parametersStore.js';
import { calculateFerias, calculateFGTS, calculatePISPASEP, calculateSeguroDesemprego, calculateHorasExtras, calculateINSSCalculator, calculateValeTransporte, calculateIRPF, calculateSalarioLiquido } from '../src/core/calculations.js';
import { calcularRescisao } from '../src/core/rescisao.js';

function approx(a,b,eps=0.02){ return Math.abs((a||0)-(b||0)) <= eps; }
function assert(cond, msg){ if(!cond){ console.error('FAIL:', msg); process.exit(1);} }

await initParametros(2025);

// Testes de acumulados para Férias
(function ferias(){
  const baseState = { diasFerias: 30, salarioBruto: 3000, abonoPecuniario: true, adiantarDecimo: true, mediaHorasExtras: 200, mediaAdicionalNoturno: 100, dependentes: 0 };
  const r = calculateFerias(baseState);
  assert(approx(r.baseComMedias, 3000+200+100), 'Férias: baseComMedias sem adicionais');

  // Testa com adicionais
  const stateComAdicionais = { ...baseState, adicionalPericulosidade: true };
  const rComAdicionais = calculateFerias(stateComAdicionais);
  const periculosidade = 3000 * 0.3;
  assert(approx(rComAdicionais.baseComMedias, 3000+200+100+periculosidade), 'Férias: baseComMedias com periculosidade');

  assert(approx(r.brutoTotal, r.segmentoFerias + r.segmentoAbono + r.segmentoDecimoAdiantado), 'Férias: brutoTotal soma segmentos');
  assert(approx(r.liquidoSegmentoFerias, r.segmentoFerias - r.inss - r.irrf), 'Férias: líquido segmento correto');
  assert(approx(r.liquidoComAbono, r.liquidoSegmentoFerias + r.segmentoAbono), 'Férias: líquido + abono');
  assert(approx(r.liquidoComTudo, r.liquidoComAbono + r.segmentoDecimoAdiantado), 'Férias: líquido total');
  assert(approx(r.fgts.valor, r.segmentoFerias * 0.08), 'Férias: FGTS 8% segmento');
  console.log('[OK] Acumulados - Férias');
})();

// Testes de acumulados para Salário Líquido
(function salarioLiquido(){
  const s = { salarioBruto: 2800, dependentes: 1, adicionalPericulosidade: true, insalubridadeGrau: 'medio', insalubridadeBase: 'salario_minimo', cargaHorariaMensal: 220, horasExtras: 10, horasNoturnas: 5, descontoVt: 50, descontoVr: 100, descontoSaude: 80, descontoAdiantamentos: 20, recebeSalarioFamilia: true, filhosSalarioFamilia: 1 };
  const r = calculateSalarioLiquido(s);
  assert(approx(r.totalDescontos, r.inss + r.irrf + r.descontoVt + r.descontoVr + r.descontoSaude + r.descontoAdiantamentos), 'Sal. Líquido: totalDescontos consistente');
  assert(approx(r.liquido, r.bruto - r.totalDescontos + r.salarioFamilia), 'Sal. Líquido: líquido consistente');
  console.log('[OK] Acumulados - Salário Líquido');
})();

// Testes de acumulados para FGTS
(function fgts(){
  const r = calculateFGTS({ salarioBruto: 3000, mesesTrabalhadosAno: 12, distribuicaoLucros: 123.45 });
  assert(approx(r.totalAno, r.deposito + r.distribuicaoLucros), 'FGTS: totalAno = deposito + distribuicao');
  console.log('[OK] Acumulados - FGTS');
})();

// Testes de acumulados para PIS/PASEP
(function pis(){
  const r = calculatePISPASEP({ mesesTrabalhadosAno: 12, salarioMensalMedio: 2000 });
  const min = r.salarioMinimoRef;
  const eleg = r.salarioMedio <= (2*min);
  const prop = eleg ? min : 0;
  assert(approx(r.valorProporcional, prop), 'PIS: proporcional coerente para 12 meses');
  console.log('[OK] Acumulados - PIS/PASEP');
})();

// Testes de acumulados para Seguro-Desemprego
(function seguro(){
  const r = calculateSeguroDesemprego({ mesesTrabalhadosUltimos36: 24, mediaSalariosUltimos3: 2500, numeroSolicitacoes: 1 });
  assert(approx(r.total, r.parcelas * r.parcela), 'Seguro: total = parcelas*parcela');
  console.log('[OK] Acumulados - Seguro-Desemprego');
})();

// Testes de acumulados para Horas Extras
(function horasExtras(){
  const r = calculateHorasExtras({ salarioBruto: 2200, mediaHorasExtras: 0, mediaAdicionalNoturno: 0, cargaHorariaMensal: 220, horasExtras: 10, percentualAdicional: 50 });
  const valorHora = (2200/220);
  assert(approx(r.valorHoras, 10 * valorHora * 1.5), 'HE: valor horas extras');
  console.log('[OK] Acumulados - Horas Extras');
})();

// Testes de acumulados para Calculadora de INSS
(function inssCalc(){
  const r = calculateINSSCalculator({ salarioBruto: 3500 });
  const soma = (r.faixas||[]).reduce((a,f)=>a+f.parcela,0);
  assert(approx(soma, r.contribuicao), 'INSS: soma faixas ~ contribuição');
  console.log('[OK] Acumulados - INSS Calc');
})();

// Testes de acumulados para Vale-Transporte
(function vt(){
  const r = calculateValeTransporte({ salarioBruto: 3000, custoDiarioTransporte: 15, diasTrabalhoMes: 22, percentualDescontoEmpregado: 6 });
  const custoTotal = 15*22;
  const descontoMax = 3000*0.06;
  const descontoEmpregado = Math.min(descontoMax, custoTotal);
  const subsidio = Math.max(0, custoTotal - descontoEmpregado);
  assert(approx(r.custoTotal, custoTotal), 'VT: custo total');
  assert(approx(r.descontoEmpregado, descontoEmpregado), 'VT: desconto empregado');
  assert(approx(r.subsidioEmpresa, subsidio), 'VT: subsidio empresa');
  console.log('[OK] Acumulados - VT');
})();

// Testes de acumulados para Rescisão
(function rescisao(){
  const r = calcularRescisao({ salarioBruto: 3000, mediaHorasExtras: 200, mediaAdicionalNoturno: 0, motivo: 'sem_justa_causa', dataAdmissao: '2023-01-10', dataDemissao: '2025-03-15', saldoFgts: 12000, avisoPrevio: 'indenizado', feriasVencidas: true, dependentes: 0, projetarAvisoParaAvos: true, descontoSaude: 150 });
  const sumBruto = r.saldoSalario + r.avisoIndenizado + r.feriasVencidas + r.tercoFeriasVencidas + r.feriasProporcionais + r.tercoFeriasProporcionais + r.decimoProporcional + r.multaFGTS;
  assert(approx(r.totalBruto, sumBruto), 'Rescisão: total bruto soma componentes');
  assert(approx(r.totalDescontos, r.inss + r.irrf + r.outrosDescontos), 'Rescisão: descontos = INSS + IRRF + outros');
  assert(approx(r.outrosDescontos, 150), 'Rescisão: outros descontos');
  assert(approx(r.totalLiquidoEstimado, r.totalBruto - r.totalDescontos), 'Rescisão: líquido estimado');
  const somaFgts = (r.fgtsReflex.componentes||[]).reduce((a,c)=>a+c.fgts,0);
  assert(approx(r.fgtsReflex.total, somaFgts), 'Rescisão: FGTS reflex total');
  console.log('[OK] Acumulados - Rescisão');
})();

console.log('\nTodos os testes de acumulados passaram.');
