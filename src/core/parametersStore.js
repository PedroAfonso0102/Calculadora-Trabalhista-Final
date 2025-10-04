/**
 * @file Repositório central para parâmetros de cálculo.
 * @module core/parametersStore
 * @description Este módulo gerencia os parâmetros legais (tabelas de INSS, IRRF, salário mínimo, etc.)
 * para diferentes anos. Ele encapsula a lógica de carregamento e fornece getters para
 * que o resto da aplicação possa acessar os valores corretos para o ano selecionado.
 */

import { getParameters, SUPPORTED_YEARS, LATEST_YEAR } from './parameters/index.js';

try { console.info('[parametersStore] v3 embedded-only + central index loaded'); } catch(_){ }

let currentYear = LATEST_YEAR;
let cacheParams = getParameters(currentYear);

/**
 * Atualiza os caches dos módulos de cálculo (INSS, IRRF) para refletir
 * a mudança nos parâmetros (ex: troca de ano).
 * @private
 */
function refreshCaches(){
  // Utiliza require dinâmico para evitar dependências circulares.
  try { const inss = require('./inss.js'); if (inss.resetINSSCache) inss.resetINSSCache(); } catch(_){}
  try { const irrf = require('./irrf.js'); if (irrf.resetIRRFCaches) irrf.resetIRRFCaches(); } catch(_){}
}

/**
 * Define o ano de referência para todos os parâmetros de cálculo.
 * Se o ano fornecido não for suportado, a operação é ignorada e um aviso é emitido.
 * Ao trocar o ano, os caches dos módulos de cálculo são reiniciados.
 * @param {number|string} year - O ano a ser definido (ex: 2024).
 * @returns {Promise<void>}
 */
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

/**
 * Obtém o ano atualmente configurado como referência para os parâmetros.
 * @returns {number} O ano atual.
 */
export function getAnoAtual(){ return currentYear; }

/**
 * Inicializa e carrega os parâmetros para um ano específico.
 * @param {number|string} [year=currentYear] - O ano para o qual os parâmetros devem ser inicializados.
 * @returns {Promise<object>} Uma promessa que resolve com o objeto de parâmetros carregado.
 */
export async function initParametros(year = currentYear){
  const y = Number(year);
  if (SUPPORTED_YEARS.includes(y)){
    currentYear = y;
  }
  cacheParams = getParameters(currentYear);
  return cacheParams;
}

/**
 * Garante que os parâmetros foram carregados antes de tentar acessá-los.
 * Lança um erro se os parâmetros não estiverem em cache.
 * @private
 */
function ensure(){ if(!cacheParams) throw new Error('Parâmetros não carregados. Chame initParametros().'); }

/**
 * Obtém a tabela de alíquotas e faixas do INSS para o ano de referência atual.
 * @returns {object[]} A tabela de contribuição do INSS.
 */
export function getINSS(){ ensure(); return cacheParams.inssTable; }

/**
 * Obtém o valor do teto de contribuição do INSS para o ano de referência atual.
 * @returns {number} O teto do INSS.
 */
export function getTetoINSS(){ ensure(); return cacheParams.inssCeiling; }

/**
 * Obtém a tabela de alíquotas e faixas do IRRF para o ano de referência atual.
 * @returns {object[]} A tabela do Imposto de Renda Retido na Fonte.
 */
export function getIRRF(){ ensure(); return cacheParams.irrfTable; }

/**
 * Obtém o valor da dedução por dependente para o cálculo do IRRF no ano de referência atual.
 * @returns {number} O valor da dedução por dependente.
 */
export function getIRRFDeducaoDependente(){ ensure(); return cacheParams.irrfDependentDeduction; }

/**
 * Obtém o valor do salário mínimo nacional para o ano de referência atual.
 * @returns {number} O valor do salário mínimo.
 */
export function getSalarioMinimo(){ ensure(); return cacheParams.salarioMinimo; }

/**
 * Reinicia o cache de parâmetros, forçando a recarga dos dados para o ano de referência atual.
 * @public
 */
export function resetParametrosCache(){ cacheParams = getParameters(currentYear); }

/**
 * Verifica se o cache de parâmetros foi preenchido.
 * @returns {boolean} Retorna `true` se os parâmetros estiverem carregados, `false` caso contrário.
 */
export function areParametrosLoaded(){ return !!cacheParams; }

/**
 * Exportações adicionais para uso em outros módulos.
 * @property {function(): boolean} areParametrosLoaded - Função que verifica se os parâmetros estão carregados.
 */
export const PARAM_EXPORTS = { areParametrosLoaded };
export { SUPPORTED_YEARS };
