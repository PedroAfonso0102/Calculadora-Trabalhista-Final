// Cálculo de FGTS relativo às férias
/**
 * FGTS: 8% sobre remuneração de férias (dias + 1/3). Abono pecuniário em regra não integra base (indenizatório). 13º adiantado segue regime próprio.
 * [ANÁLISE PREDITIVA] Ajustar se política exigir inclusão de outras parcelas.
 * @param {number} segmentoFerias Remuneração de férias (dias + 1/3)
 * @returns {{base:number, valor:number, aliquota:number}}
 */
export function calcularFGTSFerias(segmentoFerias) {
  const base = Number(segmentoFerias) || 0;
  const aliquota = 0.08;
  return { base, valor: base * aliquota, aliquota };
}
