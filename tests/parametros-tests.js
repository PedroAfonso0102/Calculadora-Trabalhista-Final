import { initParametros, getINSS, getIRRF, getIRRFDeducaoDependente, getTetoINSS, getSalarioMinimo } from '../src/core/parametersStore.js';

(async function testParametros(){
  await initParametros(2025);
  const inss = getINSS();
  const irrf = getIRRF();
  if (!Array.isArray(inss) || inss.length === 0) throw new Error('INSS table vazia');
  if (!Array.isArray(irrf) || irrf.length === 0) throw new Error('IRRF table vazia');
  if (getIRRFDeducaoDependente() <= 0) throw new Error('Dedução dependente inválida');
  if (getTetoINSS() <= 0) throw new Error('Teto INSS inválido');
  if (getSalarioMinimo() <= 0) throw new Error('Salário mínimo inválido');
  console.log('[OK] Parâmetros 2025 carregados');
})();
