// Central synchronous parameters access
// Add new years by importing and extending PARAMETERS_MAP.
import params2024 from '../../../src/data/parametros-2024.js';
import params2025 from '../../../src/data/parametros-2025.js';

const PARAMETERS_MAP = {
  2024: params2024,
  2025: params2025,
};

export const SUPPORTED_YEARS = Object.freeze(Object.keys(PARAMETERS_MAP).map(Number));
export const LATEST_YEAR = Math.max(...SUPPORTED_YEARS);

export function getParameters(year){
  const y = Number(year);
  if(!SUPPORTED_YEARS.includes(y)){
    console.warn('[parameters] Year', year, 'not supported. Falling back to', LATEST_YEAR);
    return PARAMETERS_MAP[LATEST_YEAR];
  }
  return PARAMETERS_MAP[y];
}

export function assertSupportedYear(year){
  if(!SUPPORTED_YEARS.includes(Number(year))){
    throw new Error(`[parameters] Unsupported year ${year}. Supported: ${SUPPORTED_YEARS.join(', ')}`);
  }
}

export function listSupportedYears(){
  return [...SUPPORTED_YEARS];
}
