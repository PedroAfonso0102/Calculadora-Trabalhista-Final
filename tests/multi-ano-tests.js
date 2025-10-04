import { setAnoParametros, initParametros } from '../src/core/parametersStore.js';
import { calcularINSS } from '../src/core/inss.js';
import { ajustarBaseIRRF, calcularIRRFBase } from '../src/core/irrf.js';

function assert(cond, msg){ if(!cond) throw new Error(msg); }

(async function run(){
  await setAnoParametros(2025); await initParametros(2025);
  const inss2025 = calcularINSS(5000);
  const { base: baseIRRFAdj2025 } = ajustarBaseIRRF(5000, 0);
  const irrf2025 = calcularIRRFBase(baseIRRFAdj2025);

  await setAnoParametros(2024); await initParametros(2024);
  const inss2024 = calcularINSS(5000);
  const { base: baseIRRFAdj2024 } = ajustarBaseIRRF(5000, 0);
  const irrf2024 = calcularIRRFBase(baseIRRFAdj2024);

  // O teto do INSS em 2024 é menor, então a contribuição deve ser <= 2025
  assert(inss2024.valor <= inss2025.valor, 'INSS 2024 deveria ser <= 2025 (teto menor)');
  // As tabelas de IRRF são iguais, então os valores devem coincidir
  assert(irrf2024.valor === irrf2025.valor, 'IRRF 2024 e 2025 deveriam ser iguais com mesmas tabelas');

  console.log('[multi-ano-tests] OK');
})();
