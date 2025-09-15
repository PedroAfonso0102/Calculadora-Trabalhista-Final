import { calcularRescisao } from '../src/core/rescisao.js';

function run(count){
  const base = {
    salarioBruto: 4200,
    mediaHorasExtras: 300,
    mediaAdicionalNoturno: 150,
    motivo: 'sem_justa_causa',
    dataAdmissao: '2023-02-10',
    dataDemissao: '2025-08-18',
    saldoFgts: 18000,
    avisoPrevio: 'indenizado',
    feriasVencidas: true,
    dependentes: 1,
    projetarAvisoParaAvos: true,
    excluirFeriasVencidasMulta: false,
    aplicarReducaoAviso: false
  };
  let acc = 0;
  for (let i=0;i<count;i++){
    // variar levemente salário para não bater 100% cache (mas manter faixa similar)
    base.salarioBruto = 4200 + (i % 5) * 10;
    const r = calcularRescisao(base);
    acc += r.totalLiquidoEstimado;
  }
  return acc;
}

function bench(label, fn){
  const t0 = performance.now();
  const acc = fn();
  const t1 = performance.now();
  return { label, ms: (t1 - t0).toFixed(2), acc: acc.toFixed(2) };
}

const ITER = 2000; // suficiente p/ observar ms sem demorar muito
const warm = run(200); // aquecer JIT/cache
const result = bench('rescisao_batch', () => run(ITER));
console.log(JSON.stringify({ iterations: ITER, result }, null, 2));
