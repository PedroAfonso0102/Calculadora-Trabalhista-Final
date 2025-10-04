/**
 * @file Módulo para o cálculo de rescisão de contrato de trabalho.
 * @module core/rescisao
 */

import { calcularINSS } from './inss.js';
import { ajustarBaseIRRF, calcularIRRFBase } from './irrf.js';
import { DateFormatter } from '../services/formatter.js';
import { getSalarioMinimo } from './parametersStore.js';
import { BASES_DE_CALCULO } from './calculations.js';
import { round2 } from './round.js';

/**
 * Calcula a diferença de dias entre duas datas no formato ISO (YYYY-MM-DD).
 * @param {string} inicio - A data de início no formato 'YYYY-MM-DD'.
 * @param {string} fim - A data de fim no formato 'YYYY-MM-DD'.
 * @returns {number} O número de dias de diferença. Retorna 0 se as datas forem inválidas.
 */
function diffDias(inicio, fim){
  const d1 = new Date(inicio + 'T00:00:00');
  const d2 = new Date(fim + 'T00:00:00');
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
  return Math.max(0, Math.round((d2 - d1)/(1000*60*60*24)));
}

/**
 * Calcula o número de meses proporcionais para 13º e férias.
 * Um mês é contabilizado se o empregado trabalhou 15 dias ou mais dentro daquele mês.
 * @param {string} admissao - A data de início do período a ser contado (formato ISO 'YYYY-MM-DD').
 * @param {string} demissao - A data final do período a ser contado (formato ISO 'YYYY-MM-DD').
 * @returns {number} O número de meses para o cálculo proporcional.
 */
function calcularMesesProporcionais13(admissao, demissao){
  const start = new Date(admissao + 'T00:00:00');
  const end = new Date(demissao + 'T00:00:00');
  let meses = 0;
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cursor <= end){
    const ano = cursor.getFullYear();
    const mes = cursor.getMonth();
    const primeiro = new Date(ano, mes, 1);
    const ultimo = new Date(ano, mes+1, 0);
    if (end < primeiro) break;
    // Verifica dias trabalhados no mês.
    const ini = cursor < start ? start : primeiro;
    const fim = end < ultimo ? end : ultimo;
    const diasTrabalhadosMes = (fim - ini)/(1000*60*60*24) + 1;
    if (diasTrabalhadosMes >= 15) meses++;
    cursor.setMonth(cursor.getMonth()+1);
  }
  return meses;
}

/**
 * Calcula o número de dias de aviso prévio com base no tempo de serviço.
 * O cálculo é de 30 dias base mais 3 dias por ano completo de trabalho, limitado a um total de 90 dias.
 * @param {string} motivo - O motivo da rescisão (ex: 'SEM_JUSTA_CAUSA').
 * @param {number} anos - O número de anos completos de trabalho.
 * @returns {number} O número de dias de aviso prévio. Retorna 0 se não for aplicável.
 */
function calcularAvvisoPrevioDias(motivo, anos){
  if (motivo === 'SEM_JUSTA_CAUSA' || motivo === 'ACORDO_MUTUO'){
    const adicional = Math.min(anos * 3, 60); // 30 base + até 60 adicional = máx 90
    return 30 + adicional;
  }
  return 0;
}

/**
 * @typedef {Object} ProjecaoParams
 * @property {string} inicioPeriodo - A data de início do período aquisitivo.
 * @property {string} dataDemissao - A data da demissão.
 * @property {number} diasAviso - O número de dias de aviso prévio.
 * @property {string} avisoPrevio - O tipo de aviso prévio ('indenizado', 'trabalhado').
 */

/**
 * Calcula os meses proporcionais para férias e 13º, considerando a projeção do aviso prévio indenizado.
 * @param {ProjecaoParams} params - Os parâmetros para o cálculo.
 * @returns {{meses: number, dataLimite: string}} Um objeto com o número de meses e a data limite com a projeção.
 */
function calcularMesesComProjecao({inicioPeriodo, dataAdmissaoRef, dataDemissao, diasAviso, avisoPrevio}) {
  let dataLimite = dataDemissao;
  if (avisoPrevio === 'indenizado' && diasAviso > 0) {
    const demDate = new Date(dataDemissao + 'T00:00:00');
    const proj = new Date(demDate.getTime() + diasAviso*24*60*60*1000);
    dataLimite = proj.toISOString().slice(0,10);
  }
  let meses = 0;
  try { meses = calcularMesesProporcionais13(inicioPeriodo, dataLimite); } catch(e){ meses = 0; }
  if (meses > 12) meses = 12;
  return { meses, dataLimite };
}

/**
 * Converte uma string de data (formato BR DD/MM/YYYY ou ISO parcial) para o formato ISO completo (YYYY-MM-DD).
 * @param {string} dateStr - A string da data a ser convertida.
 * @returns {string} A data no formato ISO, ou uma string vazia se a conversão falhar.
 */
function toIso(dateStr){
  if (!dateStr) return '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)){
    const d = DateFormatter.parseBR(dateStr);
    if (!d || isNaN(d.getTime())) return '';
    return d.toISOString().slice(0,10);
  }
  try {
    const d = new Date(dateStr + 'T00:00:00');
    if (!isNaN(d.getTime())) return d.toISOString().slice(0,10);
  } catch(_e){}
  return '';
}

/**
 * @typedef {Object} RescisaoState
 * @property {number} salarioBruto - O salário bruto do funcionário.
 * @property {number} mediaHorasExtras - A média mensal de horas extras.
 * @property {number} mediaAdicionalNoturno - A média mensal de adicional noturno.
 * @property {string} motivo - O motivo da rescisão (ex: 'SEM_JUSTA_CAUSA', 'PEDIDO_DEMISSAO').
 * @property {string} dataAdmissao - A data de admissão (formato 'DD/MM/YYYY' ou 'YYYY-MM-DD').
 * @property {string} dataDemissao - A data de demissão (formato 'DD/MM/YYYY' ou 'YYYY-MM-DD').
 * @property {number} saldoFgts - O saldo atual do FGTS na conta do trabalhador.
 * @property {string} avisoPrevio - O tipo de aviso prévio ('indenizado', 'trabalhado', 'dispensado').
 * @property {boolean} feriasVencidas - Indica se há períodos de férias vencidas e não gozadas.
 * @property {number} dependentes - O número de dependentes para fins de IRRF.
 * @property {boolean} aplicarReducaoAviso - Se deve aplicar a redução de 7 dias no aviso prévio trabalhado.
 * @property {boolean} adicionalPericulosidade - Se o funcionário recebe adicional de periculosidade.
 * @property {string} adicionalInsalubridadeGrau - O grau do adicional de insalubridade ('minimo', 'medio', 'maximo').
 * @property {string} insalubridadeBase - A base de cálculo para a insalubridade ('SALARIO_MINIMO' ou 'SALARIO_BRUTO').
 * @property {number} descontoVt - Outros descontos: Vale Transporte.
 * @property {number} descontoVr - Outros descontos: Vale Refeição/Alimentação.
 * @property {number} descontoSaude - Outros descontos: Plano de Saúde.
 * @property {number} descontoAdiantamentos - Outros descontos: Adiantamentos.
 */

/**
 * @typedef {Object} RescisaoResult
 * @property {string} motivo - Motivo da rescisão.
 * @property {string} dataAdmissao - Data de admissão informada.
 * @property {string} dataDemissao - Data de demissão informada.
 * @property {number} anosEstimados - Anos completos de trabalho.
 * @property {number} remuneracaoBase - Remuneração base para cálculos.
 * @property {number} periculosidade - Valor do adicional de periculosidade.
 * @property {number} insalubridade - Valor do adicional de insalubridade.
 * @property {number} dsrSobreMedias - Descanso Semanal Remunerado sobre médias.
 * @property {number} meses13 - Número de meses para o 13º proporcional.
 * @property {number} mesesFeriasProp - Número de meses para as férias proporcionais.
 * @property {number} diasAviso - Número de dias de aviso prévio.
 * @property {number} saldoSalario - Valor do saldo de salário.
 * @property {number} avisoIndenizado - Valor do aviso prévio indenizado.
 * @property {number} feriasVencidas - Valor das férias vencidas.
 * @property {number} tercoFeriasVencidas - Valor de 1/3 sobre as férias vencidas.
 * @property {number} feriasProporcionais - Valor das férias proporcionais.
 * @property {number} tercoFeriasProporcionais - Valor de 1/3 sobre as férias proporcionais.
 * @property {number} decimoProporcional - Valor do 13º salário proporcional.
 * @property {number} multaFGTS - Valor da multa de 40% ou 20% do FGTS.
 * @property {object} fgtsReflex - Detalhes do FGTS sobre as verbas rescisórias.
 * @property {number} totalBruto - Total de verbas brutas (incluindo multa FGTS).
 * @property {number} totalBrutoSemMulta - Total de verbas brutas (sem multa FGTS, para TRCT).
 * @property {number} inss - Valor total do desconto de INSS.
 * @property {Array<object>} inssBreakdown - Detalhamento do cálculo do INSS.
 * @property {number} baseINSSFolha - Base de cálculo do INSS sobre verbas mensais.
 * @property {number} baseINSSDecimo - Base de cálculo do INSS sobre o 13º.
 * @property {number} irrf - Valor total do desconto de IRRF.
 * @property {object} irrfBreakdown - Detalhamento do cálculo do IRRF.
 * @property {number} outrosDescontos - Soma dos descontos informados.
 * @property {number} totalDescontos - Soma de todos os descontos (INSS, IRRF, outros).
 * @property {number} totalLiquidoEstimado - Valor líquido estimado a receber (inclui multa FGTS).
 * @property {number} totalLiquidoSemMulta - Valor líquido a ser pago no TRCT (sem multa FGTS).
 * @property {number} montanteTotalComFGTS - Valor total que o trabalhador recebe (líquido + saldo FGTS + multa).
 * @property {number} saldoFgtsUtilizado - Saldo de FGTS informado.
 * @property {string[]} warnings - Avisos gerados durante o cálculo.
 */

/**
 * Calcula os valores totais de uma rescisão de contrato de trabalho.
 * Abrange saldo de salário, aviso prévio, férias, 13º, FGTS e impostos.
 * @param {RescisaoState} stateResc - O estado da calculadora de rescisão com todos os dados de entrada.
 * @returns {RescisaoResult} Um objeto detalhado com todas as verbas rescisórias, descontos e totais.
 */
export function calcularRescisao(stateResc){
  if (!stateResc) return {};
  const warnings = [];

  const {
    salarioBruto = 0,
    mediaHorasExtras = 0,
    mediaAdicionalNoturno = 0,
    motivo = 'SEM_JUSTA_CAUSA',
    dataAdmissao = '',
    dataDemissao = '',
    saldoFgts = 0,
    avisoPrevio = 'indenizado',
    feriasVencidas = false,
    dependentes = 0,
    projetarAvisoParaAvos = false,
    aplicarReducaoAviso = true,
    adicionalPericulosidade = false,
    adicionalInsalubridadeGrau = '0',
    insalubridadeBase = BASES_DE_CALCULO.SALARIO_MINIMO,
    descontoVt = 0,
    descontoVr = 0,
    descontoSaude = 0,
    descontoAdiantamentos = 0
  } = stateResc;

  const dataAdmissaoIso = toIso(dataAdmissao);
  const dataDemissaoIso = toIso(dataDemissao);

  if (!dataAdmissaoIso || !dataDemissaoIso){
    warnings.push('Datas de admissão/demissão necessárias para cálculo completo.');
  }

  const salario = Number(salarioBruto)||0;
  const mediaHE = Number(mediaHorasExtras) || 0;
  const mediaAN = Number(mediaAdicionalNoturno) || 0;
  const medias = mediaHE + mediaAN;

  // DSR sobre médias de variáveis (HE, Adicional Noturno).
  // Simplificação: 1/6 da média (1 dia de descanso para 6 de trabalho).
  const dsrSobreMedias = round2(medias / 6);

  // Adicionais de Periculosidade e Insalubridade
  const periculosidade = adicionalPericulosidade ? round2(salario * 0.30) : 0;
  const grau = String(adicionalInsalubridadeGrau||'0').toLowerCase();
  const refBaseInsalubridade = (insalubridadeBase === BASES_DE_CALCULO.SALARIO_BRUTO) ? salario : getSalarioMinimo();
  const percIns = grau === 'minimo' || grau === 'mínimo' || grau === 'm' ? 0.10 : (grau === 'medio' || grau === 'médio' ? 0.20 : (grau === 'maximo' || grau === 'máximo' ? 0.40 : 0));
  const insalubridade = round2(refBaseInsalubridade * percIns);

  const remuneracaoBase = salario + medias + dsrSobreMedias + periculosidade + insalubridade;

  // Calcula o saldo de salário.
  let saldoSalario = 0;
  try {
    const dem = new Date(dataDemissaoIso + 'T00:00:00');
    const inicioMes = new Date(dem.getFullYear(), dem.getMonth(), 1);
    const diasTrabMes = (dem - inicioMes)/(1000*60*60*24) + 1;
    saldoSalario = remuneracaoBase * (diasTrabMes / 30);
  } catch(e){ /* ignore */ }

  // Calcula o aviso prévio e possível redução.
  let anos = 0;
  try { anos = Math.max(0, Math.floor((diffDias(dataAdmissaoIso, dataDemissaoIso))/365)); } catch(e) { /* */ }
  let diasAviso = 0;
  if (avisoPrevio === 'indenizado' || avisoPrevio === 'trabalhado') {
    diasAviso = calcularAvvisoPrevioDias(motivo, anos);
    if (avisoPrevio === 'trabalhado' && aplicarReducaoAviso) {
      const original = diasAviso;
      diasAviso = Math.max(0, diasAviso - 7);
      if (original !== diasAviso) warnings.push('Redução de 7 dias aplicada ao aviso trabalhado (conforme opção).');
    }
  }
  let valorAviso = 0;
  if (avisoPrevio === 'indenizado' && diasAviso>0) {
    valorAviso = remuneracaoBase * (diasAviso/30);
  }

  // Calcula férias vencidas, se aplicável.
  let valorFeriasVencidas = 0;
  let tercoFeriasVencidas = 0;

  const anosCompletos = Math.floor(diffDias(dataAdmissaoIso, dataDemissaoIso) / 365);
  const temFeriasVencidas = feriasVencidas || (!feriasVencidas && anosCompletos >= 2);

  if (temFeriasVencidas) {
    const numFeriasVencidas = anosCompletos - 1;
    if (numFeriasVencidas > 0) {
      valorFeriasVencidas = remuneracaoBase * numFeriasVencidas;
      tercoFeriasVencidas = valorFeriasVencidas / 3;
      warnings.push(`${numFeriasVencidas} período(s) de férias vencidas calculado(s) automaticamente.`);
    }
  }

  // Calcula férias proporcionais.
  let mesesFeriasProp = 0;
  try {
    const adm = new Date(dataAdmissaoIso + 'T00:00:00');
    const dem = new Date(dataDemissaoIso + 'T00:00:00');
    if (!isNaN(adm.getTime()) && !isNaN(dem.getTime())) {
      const anosServ = dem.getFullYear() - adm.getFullYear();
      const aniversario = new Date(adm.getFullYear()+anosServ, adm.getMonth(), adm.getDate());
      const refDate = dem < aniversario ? new Date(aniversario.getFullYear()-1, aniversario.getMonth(), aniversario.getDate()) : aniversario;
      const { meses } = calcularMesesComProjecao({
        inicioPeriodo: refDate.toISOString().slice(0,10),
        dataAdmissaoRef: dataAdmissaoIso,
        dataDemissao: dataDemissaoIso,
        diasAviso,
        avisoPrevio
      });
      mesesFeriasProp = meses;
    }
  } catch(e){ /* noop */ }
  const feriasProporcionaisBase = remuneracaoBase * (mesesFeriasProp/12);
  const tercoFeriasProporcionais = feriasProporcionaisBase / 3;
  const feriasProporcionaisTotal = feriasProporcionaisBase + tercoFeriasProporcionais;

  // Calcula 13º proporcional.
  let meses13 = 0;
  try {
    // 13º considera apenas os meses do ano corrente.
    const dem = new Date(dataDemissaoIso + 'T00:00:00');
    const inicioAno = isNaN(dem.getTime()) ? null : new Date(dem.getFullYear(), 0, 1);
    let inicio13 = inicioAno;
    if (dataAdmissaoIso) {
      const adm = new Date(dataAdmissaoIso + 'T00:00:00');
      if (!isNaN(adm.getTime()) && inicioAno && adm > inicioAno) inicio13 = adm;
    }
    const { meses, dataLimite } = calcularMesesComProjecao({
      inicioPeriodo: inicio13 ? inicio13.toISOString().slice(0,10) : dataAdmissaoIso,
      dataAdmissaoRef: dataAdmissaoIso,
      dataDemissao: dataDemissaoIso,
      diasAviso,
      avisoPrevio
    });
    meses13 = meses;
    if (avisoPrevio === 'indenizado' && diasAviso > 0) {
      warnings.push('Projeção do aviso prévio indenizado aplicada para contagem de avos (13º e férias).');
    }
  } catch(e){ /* noop */ }
  const decimoProporcional = remuneracaoBase * (meses13/12);

  // FGTS sobre verbas rescisórias.
  // Incide sobre saldo de salário, 13º e aviso prévio indenizado.
  const fgtsRate = 0.08;
  const fgtsComponentes = [];
  if (saldoSalario > 0) fgtsComponentes.push({ label: 'Saldo Salário', base: saldoSalario, fgts: round2(saldoSalario * fgtsRate) });
  if (decimoProporcional > 0) fgtsComponentes.push({ label: '13º Proporcional', base: decimoProporcional, fgts: round2(decimoProporcional * fgtsRate) });
  if (valorAviso > 0) fgtsComponentes.push({ label: 'Aviso Indenizado', base: valorAviso, fgts: round2(valorAviso * fgtsRate) });

  // Adiciona verbas que não compõem base de FGTS para fins de exibição, mas com valor de FGTS zerado.
  if (valorFeriasVencidas > 0) fgtsComponentes.push({ label: 'Férias Vencidas + 1/3', base: valorFeriasVencidas, fgts: 0, podeExcluirMulta: true });
  if (feriasProporcionaisTotal > 0) fgtsComponentes.push({ label: 'Férias Proporcionais + 1/3', base: feriasProporcionaisTotal, fgts: 0 });

  const fgtsReflexTotal = fgtsComponentes.reduce((a, c) => a + c.fgts, 0);

  // Multa do FGTS (40% ou 20%) sobre saldo + depósitos do mês.
  const aliquotaMulta = motivo === 'ACORDO_MUTUO' ? 0.20 : (motivo === 'SEM_JUSTA_CAUSA' ? 0.40 : 0);
  let baseMultaFGTS = saldoFgts + fgtsReflexTotal;
  if (saldoFgts > 0) {
    warnings.push('O cálculo da multa de FGTS sobre o saldo existente não inclui a correção monetária dos depósitos, resultando em um valor estimado.');
  }
  const multaFGTS = baseMultaFGTS * aliquotaMulta;

  if (motivo === 'SEM_JUSTA_CAUSA' && saldoFgts === 0 && multaFGTS > 0) {
    warnings.push('Atenção: O saldo de FGTS não foi informado. A multa de 40% foi calculada considerando um saldo de R$ 0,00. Insira o saldo para um cálculo preciso.');
  }

  // --- Impostos (INSS e IRRF) ---
  // INSS é calculado separadamente para folha e 13º.
  // Aviso prévio indenizado é isento de INSS, mas o trabalhado não.
  const avisoPrevioTrabalhado = (avisoPrevio === 'trabalhado' && diasAviso > 0) ? remuneracaoBase * (diasAviso/30) : 0;
  const baseINSSFolha = saldoSalario + avisoPrevioTrabalhado;
  const baseINSSDecimo = decimoProporcional;
  const inssFolhaObj = calcularINSS(baseINSSFolha);
  const inssDecimoObj = calcularINSS(baseINSSDecimo);
  const inss = inssFolhaObj.valor + inssDecimoObj.valor;

  // --- IRRF ---
  // IRRF também é segmentado: folha e 13º (tributação exclusiva).
  // Férias indenizadas (vencidas/proporcionais) e saldo de salário compõem a base principal.
  // Aviso prévio indenizado é isento de IRRF.

  // 1. IRRF sobre verbas rescisórias (Folha)
  // Férias indenizadas são tributáveis para IRRF.
  const baseIRRFFolhaBruta = saldoSalario + valorFeriasVencidas + feriasProporcionaisTotal;
  const inssDedutivelFolha = inssFolhaObj.valor;
  const { base: baseIRRFFolhaAjustada } = ajustarBaseIRRF(Math.max(0, baseIRRFFolhaBruta - inssDedutivelFolha), dependentes);
  const irrfFolhaObj = calcularIRRFBase(baseIRRFFolhaAjustada);
  const irrfFolha = irrfFolhaObj.valor;

  // 2. IRRF sobre 13º Salário
  const baseIRRFDecimoBruta = decimoProporcional;
  const inssDedutivelDecimo = inssDecimoObj.valor;
  const { base: baseIRRFDecimoAjustada } = ajustarBaseIRRF(Math.max(0, baseIRRFDecimoBruta - inssDedutivelDecimo), dependentes);
  const irrfDecimoObj = calcularIRRFBase(baseIRRFDecimoAjustada);
  const irrfDecimo = irrfDecimoObj.valor;

  // 3. Total de IRRF
  const irrf = irrfFolha + irrfDecimo;

  const verbasBrutas = {
    saldoSalario,
    avisoIndenizado: valorAviso,
    feriasVencidas: valorFeriasVencidas,
    tercoFeriasVencidas,
    feriasProporcionais: feriasProporcionaisBase,
    tercoFeriasProporcionais,
    decimoProporcional,
    multaFGTS
  };
  const totalBruto = Object.values(verbasBrutas).reduce((a,b)=>a+b,0);
  const outrosDescontos = round2(descontoVt + descontoVr + descontoSaude + descontoAdiantamentos);
  const totalDescontos = inss + irrf + outrosDescontos;
  const totalLiquidoEstimado = totalBruto - totalDescontos;
  // Totais para o TRCT (sem somar multa FGTS no valor pago pelo empregador).
  const totalBrutoSemMulta = totalBruto - multaFGTS;
  const totalLiquidoSemMulta = totalBrutoSemMulta - totalDescontos;
  const montanteTotalComFGTS = totalLiquidoSemMulta + saldoFgts + multaFGTS;

  if (motivo === 'PEDIDO_DEMISSAO') {
    if (multaFGTS > 0) warnings.push('Pedido de demissão: multa FGTS não deveria ser aplicada.');
  }
  if (motivo === 'JUSTA_CAUSA') {
    // Alertas para verbas indevidas em caso de justa causa.
    if (valorAviso>0) warnings.push('Justa causa: aviso indenizado não devido.');
    if (feriasProporcionaisTotal>0) warnings.push('Justa causa: férias proporcionais não devidas.');
    if (decimoProporcional>0) warnings.push('Justa causa: 13º proporcional não devido.');
  }

  return {
    motivo,
    dataAdmissao,
    dataDemissao,
    anosEstimados: anos,
    remuneracaoBase,
    periculosidade,
    insalubridade,
    dsrSobreMedias,
    meses13,
    mesesFeriasProp,
    diasAviso,
    ...verbasBrutas,
    fgtsReflex: {
      total: fgtsReflexTotal,
      componentes: fgtsComponentes,
      baseMultaFGTS
    },
    totalBruto,
    totalBrutoSemMulta,
    inss,
    inssBreakdown: [
      ...inssFolhaObj.faixas.map(f => ({...f, tipo: 'folha'})),
      ...inssDecimoObj.faixas.map(f => ({...f, tipo: '13o'}))
    ],
    baseINSSFolha,
    baseINSSDecimo,
    irrf,
    irrfBreakdown: {
      folha: {
        baseBruta: baseIRRFFolhaBruta,
        inssDedutivel: inssDedutivelFolha,
        baseAjustada: baseIRRFFolhaAjustada,
        valor: irrfFolha,
        faixa: irrfFolhaObj.faixa
      },
      decimo: {
        baseBruta: baseIRRFDecimoBruta,
        inssDedutivel: inssDedutivelDecimo,
        baseAjustada: baseIRRFDecimoAjustada,
        valor: irrfDecimo,
        faixa: irrfDecimoObj.faixa
      }
    },
    outrosDescontos,
    totalDescontos,
    totalLiquidoEstimado,
    totalLiquidoSemMulta,
    montanteTotalComFGTS,
    saldoFgtsUtilizado: saldoFgts,
    warnings
  };
}
