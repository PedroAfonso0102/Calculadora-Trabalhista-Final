// parametersStore.js (renamed from paramStore.js)
// Wrapper around central parameters module providing legacy async API kept for compatibility.
import { getParameters, SUPPORTED_YEARS, LATEST_YEAR } from './parameters/index.js';

try { console.info('[parametersStore] v3 embedded-only + central index loaded'); } catch(_){ }

let currentYear = LATEST_YEAR;
let cacheParams = getParameters(currentYear);

function refreshCaches(){
  try { const inss = require('./inss.js'); if (inss.resetINSSCache) inss.resetINSSCache(); } catch(_){}
  try { const irrf = require('./irrf.js'); if (irrf.resetIRRFCaches) irrf.resetIRRFCaches(); } catch(_){}
}

export async function setAnoParametros(year){
  const y = Number(year);
  if(!SUPPORTED_YEARS.includes(y)){
    console.warn('[parametersStore] Unsupported year', year, '-> keeping', currentYear);
    return;
  }
  if (currentYear !== y){
    currentYear = y;
    cacheParams = getParameters(currentYear);
    refreshCaches();
  }
}

export function getAnoAtual(){ return currentYear; }

export async function initParametros(year = currentYear){
  const y = Number(year);
  if (SUPPORTED_YEARS.includes(y)){
    currentYear = y;
  }
  cacheParams = getParameters(currentYear);
  return cacheParams;
}

function ensure(){ if(!cacheParams) throw new Error('Parâmetros não carregados. Chame initParametros().'); }

export function getINSS(){ ensure(); return cacheParams.inss_table; }
export function getTetoINSS(){ ensure(); return cacheParams.inss_ceiling; }
export function getIRRF(){ ensure(); return cacheParams.irrf_table; }
export function getIRRFDeducaoDependente(){ ensure(); return cacheParams.irrf_dependent_deduction; }
export function getSalarioMinimo(){ ensure(); return cacheParams.salario_minimo; }

export function resetParametrosCache(){ cacheParams = getParameters(currentYear); }
export function areParametrosLoaded(){ return !!cacheParams; }

export const __PARAM_EXPORTS__ = { areParametrosLoaded };
export { SUPPORTED_YEARS };
