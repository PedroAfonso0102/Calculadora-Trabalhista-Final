// Testes simples de cálculo de férias
import { calculateFerias } from '../src/core/calculations.js';
import { initParametros } from '../src/core/parametersStore.js';

function approx(a,b,eps=0.01){return Math.abs(a-b)<=eps;}

const cenarios = [
  {
    nome: 'Base 3000 sem abono sem 13º',
    input: { diasFerias:30, salarioBruto:3000, abonoPecuniario:false, adiantarDecimo:false, mediaHorasExtras:0, mediaAdicionalNoturno:0, dependentes:0 },
    checks: r => [
      ['segmentoFerias>0', r.segmentoFerias>0],
      ['fgts coerente', approx(r.fgts.valor, r.segmentoFerias*0.08)],
      ['liquido<=segmentoFerias', r.liquidoSegmentoFerias<=r.segmentoFerias]
    ]
  },
  {
    nome: 'Com abono e adiantamento',
    input: { diasFerias:30, salarioBruto:5000, abonoPecuniario:true, adiantarDecimo:true, mediaHorasExtras:0, mediaAdicionalNoturno:0, dependentes:1 },
    checks: r => [
      ['inclui abono', r.segmentoAbono>0],
      ['inclui decimo', r.segmentoDecimoAdiantado>0],
      ['liquidoComTudo>=liquidoSegmentoFerias', r.liquidoComTudo>=r.liquidoSegmentoFerias]
    ]
  }
];

let falhas = 0;
// Garantir parâmetros carregados
await initParametros(2025);
for (const c of cenarios) {
  const r = calculateFerias(c.input);
  const resultados = c.checks(r);
  const ok = resultados.every(x=>x[1]);
  if (!ok) {
    falhas++;
    console.log(`FAIL: ${c.nome}`);
    resultados.forEach(([n,pass])=>{ if(!pass) console.log('  -',n,'falhou'); });
  } else {
    console.log(`OK: ${c.nome}`);
  }
}

if (falhas>0) {
  console.error(`\n${falhas} cenários falharam.`);
  process.exit(1);
} else {
  console.log('\nTodos os cenários passaram.');
}
