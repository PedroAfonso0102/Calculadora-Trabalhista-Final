// Parametrização anual centralizada
// Responsável por carregar arquivos JSON em data/parametros-ANO.json
// Exposição: getINSS(), getIRRF(), getTetoINSS(), getSalarioMinimo(), getIRRFDeducaoDependente()

import params2024 from '../data/parametros-2024.js';
import params2025 from '../data/parametros-2025.js';

// Versão do paramStore sem fetch/json externo
try { console.info('[paramStore] v2 embedded-only loaded'); } catch(_){}

let currentYear = 2025;
let cacheParams = null;

const PARAMS_MAP = {
  2024: params2024,
  2025: params2025
};

async function loadParams(year){
  if (cacheParams && cacheParams.ano === year) return cacheParams;
  const data = PARAMS_MAP[year];
  if (data) {
    cacheParams = data;
    return cacheParams;
  }
  return null; // Ano não suportado embutido
}

export async function setAnoParametros(year){
  if (currentYear !== year){
    currentYear = year;
    cacheParams = null;
    // Reset dependent memo caches (lazy import to avoid cycles if any)
    try {
      const inss = await import('./inss.js');
      if (inss.resetINSSCache) inss.resetINSSCache();
    } catch(_e){}
    try {
      const irrf = await import('./irrf.js');
      if (irrf.resetIRRFCaches) irrf.resetIRRFCaches();
    } catch(_e){}
  }
}

export function getAnoAtual(){ return currentYear; }

function ensureLoadedSync(){
  if (!cacheParams) throw new Error('Parâmetros não carregados. Chame initParametros() antes.');
}

export async function initParametros(year = currentYear){
  await loadParams(year);
  return cacheParams; // pode ser null se ano inexistente
}

export function getINSS(){ ensureLoadedSync(); return cacheParams.inss_table; }
export function getTetoINSS(){ ensureLoadedSync(); return cacheParams.inss_ceiling; }
export function getIRRF(){ ensureLoadedSync(); return cacheParams.irrf_table; }
export function getIRRFDeducaoDependente(){ ensureLoadedSync(); return cacheParams.irrf_dependent_deduction; }
export function getSalarioMinimo(){ ensureLoadedSync(); return cacheParams.salario_minimo; }

export function resetParametrosCache(){ cacheParams = null; }

export function areParametrosLoaded(){ return !!cacheParams; }

// Export explícito (caso algum ambiente de build faça tree-shaking agressivo)
export const __PARAM_EXPORTS__ = { areParametrosLoaded };
