// Cálculo IRRF Modular
import { getIRRF, getIRRFDeducaoDependente } from './parametersStore.js';
import { memoizeOne, memoize } from './memo.js';
import { round2 } from './round.js';

/**
 * Calcula IRRF dado uma base e número de dependentes já informado no ajuste de base.
 * Simplificação: uso direto da faixa final (modelo receita: base * aliquota - dedução).
 * @param {number} base Base já descontada de dependentes.
 * @returns {{valor:number, base:number, faixa:{limit:number, rate:number, deduction:number}|null}}
 */
function _calcularIRRFBase(base) {
  if (!base || base <= 0) return { valor: 0, base: 0, faixa: null };
  const table = getIRRF();
  const faixa = table.find(f => base <= f.limit) || table[table.length - 1];
  const bruto = base * faixa.rate;
  const valor = round2(Math.max(0, bruto - faixa.deduction));
  return { valor, base: round2(base), faixa };
}
let memoIRRF = memoizeOne(_calcularIRRFBase);
export const calcularIRRFBase = (base) => memoIRRF(base);

/**
 * Ajusta base de IRRF removendo dependentes.
 * @param {number} base Base antes da dedução.
 * @param {number} dependentes
 * @returns {{base:number, deducaoDependentes:number}}
 */
const _ajustarBaseIRRF = (base, dependentes = 0) => {
  const deducaoDependentes = (Number(dependentes) || 0) * getIRRFDeducaoDependente();
  const baseAjustada = round2(Math.max(0, base - deducaoDependentes));
  return { base: baseAjustada, deducaoDependentes: round2(deducaoDependentes) };
};
let memoAjuste = memoize(_ajustarBaseIRRF);
export const ajustarBaseIRRF = (base, dependentes=0) => memoAjuste(base, dependentes);

export function resetIRRFCaches(){
  memoIRRF = memoizeOne(_calcularIRRFBase);
  memoAjuste = memoize(_ajustarBaseIRRF);
}
