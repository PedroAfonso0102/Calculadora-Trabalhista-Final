/**
 * @file Parâmetros de Cálculo para o ano de 2022.
 * @module data/parametros-2022
 * @description Este arquivo contém os parâmetros legais e fiscais específicos para o ano de 2022,
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
  ano: 2022,
  salarioMinimo: 1212.00,
  inssCeiling: 828.39,
  inssTable: [
    { limit: 1212.00, rate: 0.075 },
    { limit: 2427.35, rate: 0.09 },
    { limit: 3641.03, rate: 0.12 },
    { limit: 7087.22, rate: 0.14 }
  ],
  irrfTable: [
    { limit: 1903.98, rate: 0, deduction: 0 },
    { limit: 2826.65, rate: 0.075, deduction: 142.80 },
    { limit: 3751.05, rate: 0.15, deduction: 354.80 },
    { limit: 4664.68, rate: 0.225, deduction: 636.13 },
    { limit: 999999999, rate: 0.275, deduction: 869.36 }
  ],
  irrfDependentDeduction: 189.59
};
