/**
 * @file Parâmetros de Cálculo para o ano de 2024.
 * @module data/parametros-2024
 * @description Este arquivo contém os parâmetros legais e fiscais específicos para o ano de 2024,
 * incluindo o valor do salário mínimo, as faixas de contribuição do INSS e as alíquotas do IRRF.
 *
 * @property {number} ano - O ano de referência dos parâmetros.
 * @property {number} salarioMinimo - O valor do salário mínimo nacional.
 * @property {number} inssCeiling - O teto máximo de contribuição para o INSS.
 * @property {Array<object>} inssTable - A tabela de faixas e alíquotas para o cálculo progressivo do INSS.
 * @property {number} inssTable.limit - O limite superior de cada faixa salarial.
 * @property {number} inssTable.rate - A alíquota de contribuição para a faixa.
 * @property {Array<object>} irrfTable - A tabela de faixas, alíquotas e deduções para o cálculo do IRRF.
 * @property {number} irrfTable.limit - O limite superior de cada faixa de renda.
 * @property {number} irrfTable.rate - A alíquota do imposto para a faixa.
 * @property {number} irrfTable.deduction - O valor a ser deduzido do imposto calculado na faixa.
 * @property {number} irrfDependentDeduction - O valor da dedução por dependente para o cálculo do IRRF.
 */
export default {
  ano: 2024,
  salarioMinimo: 1412.00,
  inssCeiling: 908.85,
  inssTable: [
    { limit: 1412.00, rate: 0.075 },
    { limit: 2666.68, rate: 0.09 },
    { limit: 4000.03, rate: 0.12 },
    { limit: 7786.02, rate: 0.14 }
  ],
  irrfTable: [
    { limit: 2259.20, rate: 0, deduction: 0 },
    { limit: 2826.65, rate: 0.075, deduction: 169.44 },
    { limit: 3751.05, rate: 0.15, deduction: 381.44 },
    { limit: 4664.68, rate: 0.225, deduction: 662.77 },
    { limit: 999999999, rate: 0.275, deduction: 896.00 }
  ],
  irrfDependentDeduction: 189.59
};
