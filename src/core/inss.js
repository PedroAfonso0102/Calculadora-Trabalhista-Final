// Cálculo INSS Progressivo Modular
import { getINSS, getTetoINSS } from './parametersStore.js';
import { memoizeOne } from './memo.js';
import { round2 } from './round.js';

/**
 * Calcula contribuição INSS progressiva sobre base.
 * Regra: aplica alíquotas por faixa acumulando até limite da tabela.
 * Resultado limitado ao teto de contribuição (INSS_CEILING) se definido como tal.
 * @param {number} base
 * @returns {{valor:number, base:number, faixas:Array<{parcela:number, aliquota:number}>}}
 */
function _calcularINSS(base) {
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

let memoWrapper = memoizeOne(_calcularINSS);
export const calcularINSS = (...args) => memoWrapper(...args);
export function resetINSSCache(){
  memoWrapper = memoizeOne(_calcularINSS);
}
