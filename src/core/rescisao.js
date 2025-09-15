// Cálculo de Rescisão Simplificado
// Verbos: saldo de salário, aviso prévio (indenizado), férias vencidas, férias proporcionais + 1/3,
// 13º proporcional, multa FGTS (sem acordo = 40%, acordo = 20%), FGTS do mês + projeção aviso.
// Simplificações: não trata horas extras reflexas além das médias já somadas; não trata adicionais específicos.

import { calcularINSS } from './inss.js';
import { ajustarBaseIRRF, calcularIRRFBase } from './irrf.js';
// Imports extras poderiam ser adicionados caso evoluamos reflexos mais complexos

/**
 * Utilidade: diferença em dias entre datas (YYYY-MM-DD)
 */
function diffDias(inicio, fim){
  const d1 = new Date(inicio + 'T00:00:00');
  const d2 = new Date(fim + 'T00:00:00');
  return Math.max(0, Math.round((d2 - d1)/(1000*60*60*24)));
}

function calcularMesesProporcionais13(admissao, demissao){
  // Regra simplificada: cada mês conta se >= 15 dias trabalhados no mês.
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
    // Interseção de período trabalhado com mês
    const ini = cursor < start ? start : primeiro;
    const fim = end < ultimo ? end : ultimo;
    const diasTrabalhadosMes = (fim - ini)/(1000*60*60*24) + 1;
    if (diasTrabalhadosMes >= 15) meses++;
    cursor.setMonth(cursor.getMonth()+1);
  }
  return meses;
}

function calcularAvvisoPrevioDias(motivo, anos){
  // Sem justa causa: 30 + 3 por ano completo (cap 90). Acordo segue mesma projeção para indenizado.
  // Justa causa e pedido: não gera indenização de aviso (caso não trabalhado).
  if (motivo === 'sem_justa_causa' || motivo === 'acordo_mutuo'){
    const adicional = Math.min(anos * 3, 60); // 30 base + até 60 adicional = máx 90
    return 30 + adicional;
  }
  return 0;
}

// Helper: retorna data limite projetada (se aplicável) e meses proporcionais entre duas datas de referência.
function calcularMesesComProjecao({inicioPeriodo, dataAdmissaoRef, dataDemissao, diasAviso, projetarAvisoParaAvos}) {
  let dataLimite = dataDemissao;
  if (projetarAvisoParaAvos && diasAviso > 0) {
    const demDate = new Date(dataDemissao + 'T00:00:00');
    const proj = new Date(demDate.getTime() + diasAviso*24*60*60*1000);
    dataLimite = proj.toISOString().slice(0,10);
  }
  let meses = 0;
  try { meses = calcularMesesProporcionais13(inicioPeriodo, dataLimite); } catch(e){ meses = 0; }
  if (meses > 12) meses = 12;
  return { meses, dataLimite };
}

export function calcularRescisao(stateResc){
  if (!stateResc) return {};
  const warnings = [];

  const {
    salarioBruto = 0,
    mediaHorasExtras = 0,
    mediaAdicionalNoturno = 0,
    motivo = 'sem_justa_causa',
    dataAdmissao = '',
    dataDemissao = '',
    saldoFgts = 0,
    avisoPrevio = 'indenizado',
    feriasVencidas = false,
    dependentes = 0,
    projetarAvisoParaAvos = false,
    excluirFeriasVencidasMulta = false,
    aplicarReducaoAviso = true
  } = stateResc;

  if (!dataAdmissao || !dataDemissao){
    warnings.push('Datas de admissão/demissão necessárias para cálculo completo.');
  }

  const salario = Number(salarioBruto)||0;
  const medias = (Number(mediaHorasExtras)||0) + (Number(mediaAdicionalNoturno)||0);
  const remuneracaoBase = salario + medias;

  // Saldo de salário (dias trabalhados no mês da demissão)
  let saldoSalario = 0;
  try {
    const dem = new Date(dataDemissao + 'T00:00:00');
    const inicioMes = new Date(dem.getFullYear(), dem.getMonth(), 1);
    const diasTrabMes = (dem - inicioMes)/(1000*60*60*24) + 1;
    saldoSalario = remuneracaoBase * (diasTrabMes / 30); // mês comercial
  } catch(e){ /* ignore */ }

  // Aviso prévio (indenizado ou trabalhado) e possível redução
  let anos = 0;
  try { anos = Math.max(0, Math.floor((diffDias(dataAdmissao, dataDemissao))/365)); } catch(e) { /* */ }
  let diasAviso = 0;
  if (avisoPrevio === 'indenizado' || avisoPrevio === 'trabalhado') {
    diasAviso = calcularAvvisoPrevioDias(motivo, anos);
    if (avisoPrevio === 'trabalhado' && aplicarReducaoAviso) {
      const original = diasAviso;
      diasAviso = Math.max(0, diasAviso - 7);
      if (original !== diasAviso) warnings.push('Redução de 7 dias aplicada ao aviso trabalhado (simplificação).');
    }
  }
  let valorAviso = 0;
  if (avisoPrevio === 'indenizado' && diasAviso>0) {
    valorAviso = remuneracaoBase * (diasAviso/30);
  }

  // Férias vencidas (se houver) = remuneração + 1/3
  let valorFeriasVencidas = 0;
  if (feriasVencidas){
    valorFeriasVencidas = remuneracaoBase + remuneracaoBase/3;
  }

  // Férias proporcionais + 1/3 (reuse helper)
  let mesesFeriasProp = 0;
  try {
    const adm = new Date(dataAdmissao + 'T00:00:00');
    const dem = new Date(dataDemissao + 'T00:00:00');
    if (!isNaN(adm) && !isNaN(dem)) {
      const anosServ = dem.getFullYear() - adm.getFullYear();
      const aniversario = new Date(adm.getFullYear()+anosServ, adm.getMonth(), adm.getDate());
      const refDate = dem < aniversario ? new Date(aniversario.getFullYear()-1, aniversario.getMonth(), aniversario.getDate()) : aniversario;
      const { meses } = calcularMesesComProjecao({
        inicioPeriodo: refDate.toISOString().slice(0,10),
        dataAdmissaoRef: dataAdmissao,
        dataDemissao,
        diasAviso,
        projetarAvisoParaAvos
      });
      mesesFeriasProp = meses;
    }
  } catch(e){ /* noop */ }
  const feriasProporcionaisBase = remuneracaoBase * (mesesFeriasProp/12);
  const feriasProporcionaisTotal = feriasProporcionaisBase + feriasProporcionaisBase/3;

  // 13º proporcional (reuse helper)
  let meses13 = 0;
  try {
    const { meses, dataLimite } = calcularMesesComProjecao({
      inicioPeriodo: dataAdmissao,
      dataAdmissaoRef: dataAdmissao,
      dataDemissao,
      diasAviso,
      projetarAvisoParaAvos
    });
    meses13 = meses;
    if (projetarAvisoParaAvos && diasAviso > 0) {
      warnings.push('Projeção de aviso aplicada para contagem de avos (13º e férias).');
    }
  } catch(e){ /* noop */ }
  const decimoProporcional = remuneracaoBase * (meses13/12);

  // Reflexos de FGTS: depósitos de 8% sobre verbas salariais/indenizatórias típicas de natureza salarial.
  // Simplificação adotada: considerar FGTS sobre saldoSalario, aviso indenizado (jurisprudência majoritária), férias proporcionais + 1/3, férias vencidas + 1/3, 13º proporcional.
  const fgtsRate = 0.08;
  const fgtsComponentes = [];
  if (saldoSalario>0) fgtsComponentes.push({ label: 'Saldo Salário', base: saldoSalario, fgts: saldoSalario*fgtsRate });
  if (valorAviso>0) fgtsComponentes.push({ label: 'Aviso Indenizado', base: valorAviso, fgts: valorAviso*fgtsRate });
  if (valorFeriasVencidas>0) fgtsComponentes.push({ label: 'Férias Vencidas + 1/3', base: valorFeriasVencidas, fgts: valorFeriasVencidas*fgtsRate, podeExcluirMulta: true });
  if (feriasProporcionaisTotal>0) fgtsComponentes.push({ label: 'Férias Proporcionais + 1/3', base: feriasProporcionaisTotal, fgts: feriasProporcionaisTotal*fgtsRate });
  if (decimoProporcional>0) fgtsComponentes.push({ label: '13º Proporcional', base: decimoProporcional, fgts: decimoProporcional*fgtsRate });
  const fgtsReflexTotal = fgtsComponentes.reduce((a,c)=>a+c.fgts,0);

  // Multa FGTS recálculo: sobre saldo existente + novos depósitos (simplificação: não atualiza correção monetária)
  const aliquotaMulta = motivo === 'acordo_mutuo' ? 0.20 : (motivo === 'sem_justa_causa' ? 0.40 : 0);
  let baseMultaFGTS = saldoFgts + fgtsReflexTotal;
  if (excluirFeriasVencidasMulta) {
    const compFV = fgtsComponentes.find(c => c.podeExcluirMulta);
    if (compFV) {
      baseMultaFGTS -= compFV.fgts;
      warnings.push('Férias vencidas excluídas da base da multa FGTS (opção selecionada).');
    }
  }
  const multaFGTS = baseMultaFGTS * aliquotaMulta;

  // Bases tributáveis para INSS / IRRF:
  // Ajuste: excluir férias indenizadas (vencidas e proporcionais) da base de IRRF/INSS simplificada.
  // Mantemos saldo + aviso + 13º proporcional. (Observação: 13º tem tratamento anual; aqui permanece simplificado.)
  // INSS segmentado: folha (saldo + aviso) e 13º proporcional (tratado separadamente na prática)
  const baseINSSFolha = saldoSalario + valorAviso;
  const baseINSSDecimo = decimoProporcional; // simplificado: usa mesma tabela progressiva
  const inssFolhaObj = calcularINSS(baseINSSFolha);
  const inssDecimoObj = calcularINSS(baseINSSDecimo);
  const inss = inssFolhaObj.valor + inssDecimoObj.valor;

  // Para IRRF (modelo simplificado): considerar base folha + 13º - INSS total.
  const baseTributavelIRRF = baseINSSFolha + baseINSSDecimo;
  const { base: baseIRRFAjustada } = ajustarBaseIRRF(Math.max(0, baseTributavelIRRF - inss), dependentes);
  const irrfObj = calcularIRRFBase(baseIRRFAjustada);
  const irrf = irrfObj.valor;

  const verbasBrutas = {
    saldoSalario,
    avisoIndenizado: valorAviso,
    feriasVencidas: valorFeriasVencidas,
    feriasProporcionais: feriasProporcionaisTotal,
    decimoProporcional,
    multaFGTS
  };
  const totalBruto = Object.values(verbasBrutas).reduce((a,b)=>a+b,0);
  const totalDescontos = inss + irrf; // simplificado
  const totalLiquidoEstimado = totalBruto - totalDescontos;

  if (motivo === 'pedido_demissao') {
    if (multaFGTS > 0) warnings.push('Pedido de demissão: multa FGTS não deveria ser aplicada.');
  }
  if (motivo === 'justa_causa') {
    // Nesta modalidade, várias verbas não são devidas; sinalizamos se usuário marcou.
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
    inss,
    inssBreakdown: [
      ...inssFolhaObj.faixas.map(f => ({...f, tipo: 'folha'})),
      ...inssDecimoObj.faixas.map(f => ({...f, tipo: '13o'}))
    ],
    baseINSSFolha,
    baseINSSDecimo,
    baseIRRF: baseIRRFAjustada,
    irrf,
    irrfFaixa: irrfObj.faixa,
    totalDescontos,
    totalLiquidoEstimado,
    warnings
  };
}
