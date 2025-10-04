/**
 * @file Utilitários de Arredondamento e Formatação.
 * @module core/round
 * @description Fornece funções para arredondamento monetário preciso e formatação de números,
 * evitando problemas comuns de ponto flutuante em JavaScript.
 */

/**
 * Arredonda um número para duas casas decimais usando a estratégia "half-up".
 * Esta técnica, que adiciona um `Number.EPSILON`, mitiga imprecisões de
 * representação de ponto flutuante binário (ex: `0.1 + 0.2 !== 0.3`).
 * @param {number} v - O número a ser arredondado.
 * @returns {number} O número arredondado para duas casas decimais. Retorna 0 se a entrada for inválida.
 * @example
 * round2(10.555); // Retorna 10.56
 * round2(10.554); // Retorna 10.55
 */
export function round2(v){
  if (!v || isNaN(v)) return 0;
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

/**
 * Formata um número como uma string com exatamente duas casas decimais.
 * Ideal para exibição de valores monetários. A função primeiro arredonda
 * o número usando `round2` para garantir a precisão antes da formatação.
 * @param {number} v - O número a ser formatado.
 * @returns {string} A string formatada (ex: "10.50"). Retorna "0.00" se a entrada for inválida.
 * @example
 * format2(10.5); // Retorna "10.50"
 * format2(10.555); // Retorna "10.56"
 */
export function format2(v){
  return round2(v).toFixed(2);
}
