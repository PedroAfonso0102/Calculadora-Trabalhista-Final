/**
 * @file Módulo para o cálculo do Imposto de Renda Retido na Fonte (IRRF).
 * @module core/irrf
 * @description Contém as funções para ajustar a base de cálculo e calcular o IRRF,
 * com otimização de cache (memoization).
 */

import { getIRRF, getIRRFDeducaoDependente } from './parametersStore.js';
import { memoizeOne, memoize } from './memo.js';
import { round2 } from './round.js';

/**
 * @typedef {Object} IrrfResult
 * @property {number} valor - O valor do IRRF a ser retido.
 * @property {number} base - A base de cálculo utilizada para o cálculo do IRRF.
 * @property {object|null} faixa - A faixa da tabela de IRRF correspondente.
 */

/**
 * Função interna que calcula o valor do IRRF com base em uma base de cálculo já ajustada.
 * Encontra a faixa de alíquota correspondente na tabela e aplica a fórmula (base * alíquota) - dedução.
 * @private
 * @param {number} base - A base de cálculo (salário bruto - INSS - dedução por dependentes).
 * @returns {IrrfResult} - Um objeto com o valor do IRRF, a base de cálculo e a faixa da tabela.
 */
function _calcularIrrfBase(base) {
  if (!base || base <= 0) return { valor: 0, base: 0, faixa: null };
  const table = getIRRF();
  const faixa = table.find(f => base <= f.limit) || table[table.length - 1];
  const bruto = base * faixa.rate;
  const valor = round2(Math.max(0, bruto - faixa.deduction));
  return { valor, base: round2(base), faixa };
}

/**
 * Wrapper de memoização para a função de cálculo do IRRF.
 * @type {function(number): IrrfResult}
 */
let memoIRRF = memoizeOne(_calcularIrrfBase);

/**
 * Calcula o valor do Imposto de Renda Retido na Fonte (IRRF) com base em uma base de cálculo já ajustada.
 * Utiliza cache para otimizar chamadas repetidas com a mesma base.
 * @public
 * @function
 * @param {number} base - A base de cálculo (geralmente, salário bruto - INSS - dedução por dependentes).
 * @returns {IrrfResult} - Um objeto com o valor do IRRF, a base de cálculo utilizada e a faixa da tabela correspondente.
 */
export const calcularIRRFBase = (base) => memoIRRF(base);

/**
 * @typedef {Object} AdjustedBaseResult
 * @property {number} base - A base de cálculo ajustada após a dedução por dependentes.
 * @property {number} deducaoDependentes - O valor total deduzido referente aos dependentes.
 */

/**
 * Função interna que ajusta a base de cálculo do IRRF, subtraindo o valor da dedução por dependentes.
 * @private
 * @param {number} base - A base de cálculo antes da dedução por dependentes (geralmente, salário bruto - INSS).
 * @param {number} [dependentes=0] - O número de dependentes.
 * @returns {AdjustedBaseResult} - Um objeto contendo a base de cálculo ajustada e o valor total deduzido.
 */
const _ajustarIrrfBase = (base, dependentes = 0) => {
  const deducaoDependentes = (Number(dependentes) || 0) * getIRRFDeducaoDependente();
  const baseAjustada = round2(Math.max(0, base - deducaoDependentes));
  return { base: baseAjustada, deducaoDependentes: round2(deducaoDependentes) };
};

/**
 * Wrapper de memoização para a função de ajuste de base do IRRF.
 * @type {function(number, number=): AdjustedBaseResult}
 */
let memoAjuste = memoize(_ajustarIrrfBase);

/**
 * Ajusta a base de cálculo do IRRF, subtraindo o valor da dedução por dependentes.
 * Utiliza cache para otimizar chamadas repetidas com os mesmos argumentos.
 * @public
 * @function
 * @param {number} base - A base de cálculo antes da dedução por dependentes (geralmente, salário bruto - INSS).
 * @param {number} [dependentes=0] - O número de dependentes.
 * @returns {AdjustedBaseResult} - Um objeto contendo a base de cálculo ajustada e o valor total deduzido.
 */
export const ajustarBaseIRRF = (base, dependentes=0) => memoAjuste(base, dependentes);

/**
 * Reinicia os caches das funções de cálculo de IRRF (`calcularIRRFBase` e `ajustarBaseIRRF`).
 * Deve ser chamado quando os parâmetros do IRRF (tabelas, valor da dedução) são alterados.
 * @public
 */
export function resetIRRFCaches(){
  memoIRRF = memoizeOne(_calcularIrrfBase);
  memoAjuste = memoize(_ajustarIrrfBase);
}
