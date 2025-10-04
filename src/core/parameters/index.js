// Central synchronous parameters access
// Adicione novos anos importando e estendendo PARAMETERS_MAP.

import params2020 from '../../../src/data/parametros-2020.js';
import params2021 from '../../../src/data/parametros-2021.js';
import params2022 from '../../../src/data/parametros-2022.js';
import params2023 from '../../../src/data/parametros-2023.js';
import params2024 from '../../../src/data/parametros-2024.js';
import params2025 from '../../../src/data/parametros-2025.js';

const PARAMETERS_MAP = {
  2020: params2020,
  2021: params2021,
  2022: params2022,
  2023: params2023,
  2024: params2024,
  2025: params2025,
};

/**
 * @constant {number[]} SUPPORTED_YEARS
 * @description Uma lista de anos para os quais existem parâmetros definidos.
 */
export const SUPPORTED_YEARS = Object.freeze(Object.keys(PARAMETERS_MAP).map(Number));

/**
 * @constant {number} LATEST_YEAR
 * @description O ano mais recente para o qual existem parâmetros definidos.
 */
export const LATEST_YEAR = Math.max(...SUPPORTED_YEARS);

/**
 * Obtém os parâmetros para um ano específico.
 * Se o ano não for suportado, retorna os parâmetros do ano mais recente.
 * @param {number|string} year - O ano para o qual obter os parâmetros.
 * @returns {object} O objeto de parâmetros para o ano especificado.
 */
export function getParameters(year){
  const y = Number(year);
  if(!SUPPORTED_YEARS.includes(y)){
    console.warn('[parameters] Ano', year, 'não suportado. Usando como padrão', LATEST_YEAR);
    return PARAMETERS_MAP[LATEST_YEAR];
  }
  return PARAMETERS_MAP[y];
}

/**
 * Verifica se um ano é suportado, lançando um erro caso não seja.
 * @param {number|string} year - O ano a ser verificado.
 * @throws {Error} Lança um erro se o ano não estiver na lista de anos suportados.
 */
export function assertSupportedYear(year){
  if(!SUPPORTED_YEARS.includes(Number(year))){
    throw new Error(`[parameters] Ano ${year} não suportado. Suportados: ${SUPPORTED_YEARS.join(', ')}`);
  }
}

/**
 * Retorna uma lista de todos os anos suportados.
 * @returns {number[]} Uma cópia da lista de anos suportados.
 */
export function listSupportedYears(){
  return [...SUPPORTED_YEARS];
}
