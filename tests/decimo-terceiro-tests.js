import { calcularDecimoTerceiro } from '../src/core/decimoTerceiro.js';
import { initParametros } from '../src/core/parametersStore.js';

function approx(a,b, tol=0.01){
  if (Math.abs(a-b) > tol) throw new Error(`Valores divergentes: ${a} vs ${b}`);
}

async function run(){
  const base = {
    salarioBruto: 3600,
    mesesTrabalhados: 12,
    mediaHorasExtras: 200,
    mediaAdicionalNoturno: 0,
    adiantamentoRecebido: 1800, // 50%
    dependentes: 0
  };
  const r = calcularDecimoTerceiro(base);
  if (r.proporcionalBruto <=0) throw new Error('Proporcional inválido');
  if (r.primeiraParcelaTeorica < 1) throw new Error('Primeira parcela inválida');
  if (r.liquidoTotal <=0) throw new Error('Líquido total não calculado');
  console.log('[OK] Cálculo 13º completo cenário base');

  const parcial = { ...base, mesesTrabalhados: 6, adiantamentoRecebido: 0 };
  const r2 = calcularDecimoTerceiro(parcial);
  approx(r2.proporcionalBruto, (6/12)*(3600+200));
  console.log('[OK] Cálculo 13º proporcional 6 meses');

  console.log('Executando: Validação de adicionais no 13º...');
  const base13 = {
    salarioBruto: 3000,
    mesesTrabalhados: 12
  };
  const rSem = calcularDecimoTerceiro(base13);

  const rCom = calcularDecimoTerceiro({ ...base13, adicionalPericulosidade: true });
  if (rCom.baseComMedias <= rSem.baseComMedias) throw new Error('Base com médias deve aumentar com periculosidade');
  if (rCom.proporcionalBruto <= rSem.proporcionalBruto) throw new Error('Proporcional bruto deve aumentar com periculosidade');

  console.log('[OK] Validação de adicionais no 13º');
}

await initParametros(2025);
await run();
