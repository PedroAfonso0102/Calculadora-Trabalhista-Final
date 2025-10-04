/**
 * @file Módulo para cálculo do FGTS sobre verbas específicas.
 * @module core/fgts
 * @description Este módulo contém funções para calcular o depósito do FGTS
 * sobre diferentes tipos de remuneração, como férias e 13º salário.
 */

/**
 * @typedef {Object} FgtsResult
 * @property {number} base - A base de cálculo sobre a qual o FGTS foi calculado.
 * @property {number} valor - O valor do depósito de FGTS (8% da base).
 * @property {number} aliquota - A alíquota utilizada para o cálculo (0.08).
 */

/**
 * Calcula o FGTS sobre uma base de remuneração específica (ex: férias, 13º).
 * A alíquota padrão do FGTS é de 8%.
 * @param {number} baseCalculo - A remuneração base sobre a qual o FGTS deve ser calculado.
 * @returns {FgtsResult} Um objeto com a base de cálculo, o valor do FGTS e a alíquota.
 */
export function calcularFGTSFerias(baseCalculo) {
  const base = Number(baseCalculo) || 0;
  const aliquota = 0.08;
  return { base, valor: base * aliquota, aliquota };
}
