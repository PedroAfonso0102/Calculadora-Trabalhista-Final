// Cálculo de 13º Salário
import { ajustarBaseIRRF, calcularIRRFBase } from './irrf.js';
import { calcularINSS } from './inss.js';
import { round2 } from './round.js';
import { calcularFGTSFerias } from './fgts.js'; // reutilização da mesma lógica de 8%

/**
 * Cálculo do 13º (modelo simplificado):
 * - Proporcional = (mesesTrabalhados / 12) * (salário + médias)
 * - 1ª parcela (adiantamento): metade da base proporcional (se ainda não recebida)
 * - 2ª parcela: proporcional - adiantamento - INSS - IRRF
 * - INSS/IRRF aplicados sobre a base proporcional integral (não só segunda parcela)
 * - FGTS (informativo) 8% sobre base proporcional
 * @param {Object} state13 { salarioBruto, mesesTrabalhados, adiantamentoRecebido, mediaHorasExtras, mediaAdicionalNoturno, dependentes }
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

  const baseComMedias = round2(salarioBruto + mediaHorasExtras + mediaAdicionalNoturno);
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
