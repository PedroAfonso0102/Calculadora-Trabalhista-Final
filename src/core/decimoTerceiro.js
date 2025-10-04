/**
 * @file Módulo para o cálculo do 13º salário.
 * @module core/decimoTerceiro
 */

import { ajustarBaseIRRF, calcularIRRFBase } from './irrf.js';
import { calcularINSS } from './inss.js';
import { round2 } from './round.js';
import { calcularFGTSFerias } from './fgts.js'; // reutilização da mesma lógica de 8%
import { getSalarioMinimo } from './parametersStore.js';
import { BASES_DE_CALCULO } from './calculations.js';

/**
 * @typedef {Object} DecimoTerceiroState
 * @property {number} mesesTrabalhados - O número de meses trabalhados no ano.
 * @property {number} salarioBruto - O salário bruto do funcionário.
 * @property {number} mediaHorasExtras - A média de horas extras.
 * @property {number} mediaAdicionalNoturno - A média de adicional noturno.
 * @property {number} dependentes - O número de dependentes para dedução do IRRF.
 * @property {number} adiantamentoRecebido - O valor do adiantamento da primeira parcela já recebido.
 * @property {boolean} adicionalPericulosidade - Se o funcionário recebe adicional de periculosidade.
 * @property {string} adicionalInsalubridadeGrau - O grau do adicional de insalubridade ('minimo', 'medio', 'maximo').
 * @property {string} insalubridadeBase - A base de cálculo para a insalubridade ('SALARIO_MINIMO' ou 'SALARIO_BRUTO').
 */

/**
 * @typedef {Object} DecimoTerceiroResult
 * @property {number} mesesTrabalhados - Número de meses trabalhados considerados no cálculo.
 * @property {number} salarioBruto - Salário bruto informado.
 * @property {number} mediaHorasExtras - Média de horas extras informada.
 * @property {number} mediaAdicionalNoturno - Média de adicional noturno informada.
 * @property {number} periculosidade - Valor do adicional de periculosidade calculado.
 * @property {number} insalubridade - Valor do adicional de insalubridade calculado.
 * @property {number} baseComMedias - Base de cálculo do 13º, incluindo médias e adicionais.
 * @property {number} proporcionalBruto - Valor bruto do 13º salário, proporcional aos meses trabalhados.
 * @property {number} primeiraParcelaTeorica - Valor teórico da primeira parcela (50% do bruto proporcional).
 * @property {number} adiantamentoRecebido - Valor do adiantamento informado pelo usuário.
 * @property {number} segundaParcela - Valor líquido da segunda parcela, após todos os descontos.
 * @property {number} inss - Valor do desconto do INSS sobre o 13º salário.
 * @property {Array<object>} inssBreakdown - Detalhamento do cálculo do INSS por faixas.
 * @property {number} baseIRRF - Base de cálculo para o IRRF.
 * @property {number} irrf - Valor do desconto do IRRF sobre o 13º salário.
 * @property {object} irrfFaixa - Faixa de alíquota do IRRF aplicada.
 * @property {number} deducaoDependentes - Valor da dedução por dependentes no IRRF.
 * @property {object} fgts - Objeto com o cálculo do FGTS sobre o 13º salário.
 * @property {number} liquidoTotal - Valor líquido total do 13º salário (soma das parcelas líquidas).
 * @property {number} dependentes - Número de dependentes informado.
 * @property {string[]} warnings - Avisos sobre o cálculo.
 */

/**
 * Calcula o 13º salário (décimo terceiro) com base nos dados fornecidos pelo usuário.
 * @param {DecimoTerceiroState} state13 - O estado da calculadora de 13º salário.
 * @returns {DecimoTerceiroResult} Um objeto contendo todos os detalhes do cálculo do 13º salário.
 */
export function calcularDecimoTerceiro(state13) {
  if (!state13) return {};
  const warnings = [];
  let mesesTrabalhados = Number(state13.mesesTrabalhados) || 0;
  if (mesesTrabalhados < 0) { warnings.push('Meses trabalhados < 0 ajustado para 0.'); mesesTrabalhados = 0; }
  if (mesesTrabalhados > 12) { warnings.push('Meses trabalhados > 12 ajustado para 12.'); mesesTrabalhados = 12; }

  const salarioBruto = Number(state13.salarioBruto) || 0;
  const mediaHorasExtras = Number(state13.mediaHorasExtras) || 0;
  const mediaAdicionalNoturno = Number(state13.mediaAdicionalNoturno) || 0;
  const dependentes = Number(state13.dependentes) || 0;
  const adiantamentoRecebido = Number(state13.adiantamentoRecebido) || 0;
  const adicionalPericulosidade = !!state13.adicionalPericulosidade;
  const adicionalInsalubridadeGrau = state13.adicionalInsalubridadeGrau || '0';
  const insalubridadeBase = state13.insalubridadeBase || BASES_DE_CALCULO.SALARIO_MINIMO;

  // Adicionais de Periculosidade e Insalubridade
  const periculosidade = adicionalPericulosidade ? round2(salarioBruto * 0.30) : 0;
  const grau = String(adicionalInsalubridadeGrau).toLowerCase();
  const refBaseInsalubridade = (insalubridadeBase === BASES_DE_CALCULO.SALARIO_BRUTO) ? salarioBruto : getSalarioMinimo();
  const percIns = grau === 'minimo' || grau === 'mínimo' || grau === 'm' ? 0.10 : (grau === 'medio' || grau === 'médio' ? 0.20 : (grau === 'maximo' || grau === 'máximo' ? 0.40 : 0));
  const insalubridade = round2(refBaseInsalubridade * percIns);

  const baseComMedias = round2(salarioBruto + mediaHorasExtras + mediaAdicionalNoturno + periculosidade + insalubridade);
  const proporcionalBruto = round2((mesesTrabalhados / 12) * baseComMedias);

  const primeiraParcelaTeorica = round2(proporcionalBruto * 0.5);
  if (adiantamentoRecebido > 0 && adiantamentoRecebido > primeiraParcelaTeorica + 0.01) {
    warnings.push('Adiantamento informado maior que 50% da base proporcional.');
  }

  // INSS e IRRF sobre proporcional bruto
  const inssObj = calcularINSS(proporcionalBruto);
  const inss = inssObj.valor;
  const { base: baseIRRFAjustada, deducaoDependentes } = ajustarBaseIRRF(Math.max(0, proporcionalBruto - inss), dependentes);
  const irrfObj = calcularIRRFBase(baseIRRFAjustada);
  const irrf = irrfObj.valor;

  const segundaParcela = round2(proporcionalBruto - adiantamentoRecebido - inss - irrf);
  const liquidoTotal = round2(proporcionalBruto - inss - irrf); // soma das parcelas efetivamente

  const fgtsObj = calcularFGTSFerias(proporcionalBruto); // mesma alíquota de 8%

  return {
    mesesTrabalhados,
    salarioBruto,
    mediaHorasExtras,
    mediaAdicionalNoturno,
    periculosidade,
    insalubridade,
    baseComMedias,
    proporcionalBruto,
    primeiraParcelaTeorica,
    adiantamentoRecebido,
    segundaParcela,
    inss,
    inssBreakdown: inssObj.faixas,
    baseIRRF: baseIRRFAjustada,
    irrf,
    irrfFaixa: irrfObj.faixa,
    deducaoDependentes,
    fgts: fgtsObj,
    liquidoTotal,
    dependentes,
    warnings
  };
}
