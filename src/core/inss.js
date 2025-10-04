/**
 * @file Módulo para cálculo da contribuição do INSS.
 * @module core/inss
 * @description Este módulo contém a lógica para o cálculo progressivo do INSS,
 * utilizando as faixas e o teto da previdência. Inclui otimização de cache (memoization).
 */

import { getINSS, getTetoINSS } from './parametersStore.js';
import { memoizeOne } from './memo.js';
import { round2 } from './round.js';

/**
 * @typedef {Object} InssBreakdown
 * @property {number} valor - O valor total da contribuição do INSS.
 * @property {number} base - A base de cálculo utilizada.
 * @property {Array<object>} faixas - Um array com o detalhamento de cada faixa de contribuição.
 * @property {number} faixas.parcela - O valor da contribuição na faixa específica.
 * @property {number} faixas.aliquota - A alíquota aplicada na faixa.
 * @property {string} faixas.faixa - A descrição da faixa de valor.
 */

/**
 * Função interna que calcula a contribuição do INSS de forma progressiva.
 * A função percorre as faixas de contribuição, calcula o valor para cada uma e soma
 * até atingir a base de cálculo ou o teto da previdência.
 * @private
 * @param {number} base - A base de cálculo para a contribuição (salário bruto ou outro rendimento tributável).
 * @returns {InssBreakdown} - Um objeto contendo o valor total da contribuição, a base de cálculo e o detalhamento de cada faixa.
 */
function _calcularInss(base) {
  if (!base || base <= 0) return { valor: 0, base: 0, faixas: [] };
  let restante = base;
  let total = 0;
  const breakdown = [];
  let anteriorLimite = 0;
  const table = getINSS();
  const teto = getTetoINSS();
  for (const faixa of table) {
    const limiteFaixa = faixa.limit;
    const amplitude = limiteFaixa - anteriorLimite;
    const tributavel = Math.min(restante, amplitude);
    if (tributavel <= 0) break;
  const parcela = tributavel * faixa.rate;
  const parcelaR = round2(parcela);
  breakdown.push({ parcela: parcelaR, aliquota: faixa.rate, faixa: `${anteriorLimite.toFixed(2)}-${limiteFaixa.toFixed(2)}` });
  total += parcelaR;
    restante -= tributavel;
    anteriorLimite = limiteFaixa;
    if (restante <= 0) break;
  }
  total = round2(Math.min(total, teto));
  return { valor: total, base: round2(base), faixas: breakdown };
}

/**
 * Wrapper de memoização para a função de cálculo do INSS.
 * @type {function(number): InssBreakdown}
 */
let memoWrapper = memoizeOne(_calcularInss);

/**
 * Calcula a contribuição do INSS de forma progressiva, com cache de resultados.
 * Respeita as faixas salariais e o teto da previdência.
 * @public
 * @function
 * @param {number} base - A base de cálculo para a contribuição.
 * @returns {InssBreakdown} - O objeto com o resultado do cálculo.
 */
export const calcularINSS = (...args) => memoWrapper(...args);

/**
 * Reinicia o cache da função de cálculo do INSS.
 * Deve ser chamada quando os parâmetros do INSS (tabelas, teto) são alterados,
 * como por exemplo, na virada do ano fiscal.
 * @public
 */
export function resetINSSCache(){
  memoWrapper = memoizeOne(_calcularInss);
}
