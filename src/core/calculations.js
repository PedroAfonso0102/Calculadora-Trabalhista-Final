// Lógica de negócio pura. Intocável.
/**
 * Application Configuration
 *
 * This file centralizes all constants, tables, and business rule parameters.
 * It serves as the single source of truth for legal values and configurations,
 * making it easy to update the application as laws change.
 */

// Base de cálculo para adicionais (ex: insalubridade)
export const BASES_DE_CALCULO = {
    SALARIO_MINIMO: 'salario_minimo',
    SALARIO_BRUTO: 'salario_bruto',
};

// Salário Mínimo e Teto INSS para 2025 (Valores de exemplo, devem ser atualizados)
export const SALARIO_MINIMO_2025 = 1550.00;
export const INSS_CEILING = 908.85; // Teto de contribuição para 2024 (exemplo)

// Tabela de Contribuição INSS Progressiva 2025 (Valores de exemplo baseados em 2024)
export const INSS_TABLE = [
    { limit: 1412.00, rate: 0.075 },
    { limit: 2666.68, rate: 0.09 },
    { limit: 4000.03, rate: 0.12 },
    { limit: 7786.02, rate: 0.14 },
];

// Tabela de Imposto de Renda Retido na Fonte (IRRF) 2025 (Valores de exemplo)
export const IRRF_TABLE = [
    { limit: 2259.20, rate: 0, deduction: 0 },
    { limit: 2826.65, rate: 0.075, deduction: 169.44 },
    { limit: 3751.05, rate: 0.15, deduction: 381.44 },
    { limit: 4664.68, rate: 0.225, deduction: 662.77 },
    { limit: Infinity, rate: 0.275, deduction: 896.00 },
];

// Dedução por dependente no IRRF
export const IRRF_DEPENDENT_DEDUCTION = 189.59;

// Parâmetros do Salário Família
export const SALARIO_FAMILIA_LIMIT = 1819.26; // Limite de renda para ter direito
export const SALARIO_FAMILIA_VALUE = 62.04;  // Valor por filho

// Outros parâmetros legais e de negócio
export const PARAMETROS_2025 = {
    ADICIONAL_PERICULOSIDADE: 0.30, // 30%
};

import { calcularINSS } from './inss.js';
import { ajustarBaseIRRF, calcularIRRFBase } from './irrf.js';
import { calcularFGTSFerias } from './fgts.js';

export function calculateFerias(feriasState) {
    if (!feriasState) return {};
    let diasFerias = Number(feriasState.diasFerias) || 0;
    const salarioBruto = Number(feriasState.salarioBruto) || 0;
    const abonoPecuniario = !!feriasState.abonoPecuniario;
    const adiantarDecimo = !!feriasState.adiantarDecimo;
    const mediaHorasExtras = Number(feriasState.mediaHorasExtras) || 0;
    const mediaAdicionalNoturno = Number(feriasState.mediaAdicionalNoturno) || 0;
    const warnings = [];
    if (diasFerias < 0) { warnings.push('Dias de férias não pode ser negativo. Ajustado para 0.'); diasFerias = 0; }
    if (diasFerias > 30) { warnings.push('Dias de férias acima de 30. Ajustado para 30.'); diasFerias = 30; }
    if (abonoPecuniario && diasFerias < 20) { warnings.push('Venda de 1/3 (abono) geralmente implica usufruir 20 dias ou mais. Verifique.'); }

    const baseComMedias = salarioBruto + mediaHorasExtras + mediaAdicionalNoturno;
    const valorDia = baseComMedias / 30;
    const remuneracaoDiasFerias = valorDia * diasFerias;
    const adicionalUmTerco = remuneracaoDiasFerias / 3;
    const valorAbono = abonoPecuniario ? valorDia * 10 : 0;
    const decimoAdiantado = adiantarDecimo ? salarioBruto * 0.5 : 0;

    const segmentoFerias = remuneracaoDiasFerias + adicionalUmTerco;
    const segmentoAbono = valorAbono;
    const segmentoDecimoAdiantado = decimoAdiantado;
    const brutoReferencial = segmentoFerias;
    const brutoTotal = segmentoFerias + segmentoAbono + segmentoDecimoAdiantado;

    const inssObj = calcularINSS(segmentoFerias);
    const inss = inssObj.valor;
    const baseINSS = segmentoFerias;

    const dependentes = Number(feriasState.dependentes) || 0;
    const baseBrutaIRRF = Math.max(0, segmentoFerias - inss);
    const { base: baseIRRFAjustada, deducaoDependentes } = ajustarBaseIRRF(baseBrutaIRRF, dependentes);
    const irrfObj = calcularIRRFBase(baseIRRFAjustada);
    const irrf = irrfObj.valor;
    const baseIRRF = baseIRRFAjustada;

    const liquidoSegmentoFerias = segmentoFerias - inss - irrf;
    const liquidoComAbono = liquidoSegmentoFerias + segmentoAbono;
    const liquidoComTudo = liquidoComAbono + segmentoDecimoAdiantado;

    // Warnings fiscais explicativos
    if (segmentoAbono > 0) {
        warnings.push('Abono pecuniário excluído das bases INSS/IRRF (tratado como indenizatório).');
    }
    if (segmentoDecimoAdiantado > 0) {
        warnings.push('Adiantamento de 13º exibido mas não integrado às bases de férias para INSS/IRRF.');
    }

    // FGTS sobre segmento férias
    const fgtsObj = calcularFGTSFerias(segmentoFerias);

    return {
        diasFerias,
        salarioBruto,
        mediaHorasExtras,
        mediaAdicionalNoturno,
        baseComMedias,
        valorDia,
        remuneracaoDiasFerias,
        adicionalUmTerco,
        valorAbono,
        decimoAdiantado,
        segmentoFerias,
        segmentoAbono,
        segmentoDecimoAdiantado,
        brutoReferencial,
        brutoTotal,
        baseINSS,
        inss,
        baseIRRF,
        irrf,
        liquidoSegmentoFerias,
        liquidoComAbono,
        liquidoComTudo,
        dependentes,
        deducaoDependentes,
        inssBreakdown: inssObj.faixas,
        irrfFaixa: irrfObj.faixa,
        fgts: fgtsObj,
        warnings
    };
}

// ================= Novas Calculadoras =================
import { round2 } from './round.js';
import { calcularRescisao } from './rescisao.js'; // potencial reutilização futura

/** FGTS (acompanhamento anual simples)
 * Base: salário + médias * meses trabalhados (limite 12) * 8% + distribuição de lucros informada.
 */
export function calculateFGTS(fgtsState){
    if (!fgtsState) return null;
    const salario = Number(fgtsState.salarioBruto)||0;
    const meses = Math.min(12, Math.max(0, Number(fgtsState.mesesTrabalhadosAno)||0));
    const medias = (Number(fgtsState.mediaHorasExtras)||0) + (Number(fgtsState.mediaAdicionalNoturno)||0);
    const baseMensal = salario + medias;
    const totalBase = baseMensal * meses;
    const aliquota = Number(fgtsState.aliquota)||0.08;
    const deposito = round2(totalBase * aliquota);
    const distribuicaoLucros = Number(fgtsState.distribuicaoLucros)||0;
    return {
        meses,
        baseMensal: round2(baseMensal),
        totalBase: round2(totalBase),
        aliquota,
        deposito,
        distribuicaoLucros: round2(distribuicaoLucros),
        totalAno: round2(deposito + distribuicaoLucros)
    };
}

/** PIS/PASEP Abono Salarial (simplificado)
 * Critério simplificado: valor anual proporcional = (meses/12) * salário mínimo (proxy), se salário médio <= 2 SM.
 * Usa SALARIO_MINIMO_2025 como referência do ano corrente carregado (placeholder até parametrização multi-ano).
 */
export function calculatePISPASEP(pisState, legalTexts){
    if (!pisState) return null;
    const meses = Math.min(12, Math.max(0, Number(pisState.mesesTrabalhadosAno)||0));
    const salarioMedio = Number(pisState.salarioMensalMedio)||Number(pisState.salarioBruto)||0;
    const salarioMinimoRef = SALARIO_MINIMO_2025; // TODO: parametrizar via parametersStore
    const elegivel = salarioMedio > 0 && salarioMedio <= (2*salarioMinimoRef);
    const valorIntegral = salarioMinimoRef;
    const proporcional = elegivel ? round2(valorIntegral * (meses/12)) : 0;
    return {
        meses,
        salarioMedio,
        salarioMinimoRef,
        elegivel,
        valorIntegral,
        valorProporcional: proporcional
    };
}

/** Seguro Desemprego (simplificado)
 * Faixas fictícias baseadas em salário médio. Número de parcelas depende de meses trabalhados e número de solicitações.
 */
export function calculateSeguroDesemprego(sdState){
    if (!sdState) return null;
    const meses = Math.max(0, Number(sdState.mesesTrabalhadosUltimos36)||0);
    const media = Number(sdState.mediaSalariosUltimos3)||Number(sdState.salarioBruto)||0;
    const solicitacoes = Math.max(1, Number(sdState.numeroSolicitacoes)||1);
    // Tabela simplificada
    let parcelaBase = 0;
    if (media <= 2000) parcelaBase = media * 0.8;
    else if (media <= 3000) parcelaBase = 1600 + (media-2000)*0.5; else parcelaBase = 2100; // tetos fictícios
    parcelaBase = round2(parcelaBase);
    // Número de parcelas (simplificado)
    let parcelas = 3;
    if (meses >= 24) parcelas = solicitacoes >= 3 ? 5 : 5;
    else if (meses >= 12) parcelas = 4;
    else if (meses >= 6) parcelas = 3; else parcelas = 0;
    const total = round2(parcelas * parcelaBase);
    return { meses, media, solicitacoes, parcela: parcelaBase, parcelas, total };
}

/** Horas Extras
 * Base: (salario + médias) / cargaHorariaMensal = valorHora
 * horasExtras * (1 + percentualAdicional/100) * valorHora
 */
export function calculateHorasExtras(heState){
    if (!heState) return null;
    const salario = Number(heState.salarioBruto)||0;
    const medias = (Number(heState.mediaHorasExtras)||0)+(Number(heState.mediaAdicionalNoturno)||0);
    const carga = Math.max(1, Number(heState.cargaHorariaMensal)||220);
    const valorHora = (salario + medias)/carga;
    const horasExtras = Number(heState.horasExtras)||0;
    const adicional = (Number(heState.percentualAdicional)||50)/100;
    const valorHoras = round2(horasExtras * valorHora * (1+adicional));
    return { carga, valorHora: round2(valorHora), horasExtras, adicionalPercent: adicional*100, valorHoras };
}

/** INSS Calculator detalhada (reuso do módulo inss) */
export function calculateINSSCalculator(inssState){
    if (!inssState) return null;
    const salario = Number(inssState.salarioBruto)||0;
    if (!salario) return null;
    const inssObj = calcularINSS(salario);
    return { salario, contribuicao: inssObj.valor, faixas: inssObj.faixas };
}

/** Vale Transporte
 * Desconto máximo legal 6% sobre salário base. Custo efetivo = custoDiarioTransporte * dias.
 * Empresa paga diferença se custo > desconto.
 */
export function calculateValeTransporte(vtState){
    if (!vtState) return null;
    const salario = Number(vtState.salarioBruto)||0;
    const custoDiario = Number(vtState.custoDiarioTransporte)||0;
    const dias = Math.max(0, Number(vtState.diasTrabalhoMes)||0);
    const percentual = Number(vtState.percentualDescontoEmpregado)||6;
    const descontoMax = round2(salario * (percentual/100));
    const custoTotal = round2(custoDiario * dias);
    const descontoEmpregado = Math.min(descontoMax, custoTotal);
    const subsidioEmpresa = round2(Math.max(0, custoTotal - descontoEmpregado));
    return { salario, custoDiario, dias, percentual, custoTotal, descontoMax, descontoEmpregado, subsidioEmpresa };
}

/** IRPF Anual simplificado (não confundir com IRRF mensal)
 * Soma rendimentos tributáveis anuais e aplica tabela mensal *12 (simplificação grosseira) - usar tabela já existente multiplicada.
 */
export function calculateIRPF(irpfState){
    if (!irpfState) return null;
    const salario = Number(irpfState.salarioBruto)||0;
    if (!salario) return null;
    const dependentes = Number(irpfState.dependentes)||0;
    const outrasDeducoes = Number(irpfState.outrasDeducoes)||0;
    const pensao = Number(irpfState.pensaoAlimenticia)||0;
    const prevOficial = Number(irpfState.contribuicaoPrevidenciaOficial)||0;
    const prevPrivada = Number(irpfState.contribuicaoPrevidenciaPrivada)||0;
    const rendimento13 = Number(irpfState.rendimento13)||0;
    const rendimentoFerias = Number(irpfState.rendimentoFerias)||0;
    const rendimentoAnual = salario*12 + rendimento13 + rendimentoFerias; // simplificado
    const deducaoDependentesAno = dependentes * IRRF_DEPENDENT_DEDUCTION * 12;
    const deducoesTotais = outrasDeducoes + pensao + prevOficial + prevPrivada + deducaoDependentesAno;
    const base = Math.max(0, rendimentoAnual - deducoesTotais);
    // Usa tabela mensal escalada: aplica faixa sobre base/12 e multiplica
    const baseMensal = base/12;
    const faixa = IRRF_TABLE.find(f => baseMensal <= f.limit) || IRRF_TABLE[IRRF_TABLE.length-1];
    const impostoMensal = Math.max(0, baseMensal * faixa.rate - faixa.deduction);
    const impostoAnual = round2(impostoMensal * 12);
    const efetiva = base > 0 ? (impostoAnual/base)*100 : 0;
    return { rendimentoAnual: round2(rendimentoAnual), deducoesTotais: round2(deducoesTotais), base: round2(base), impostoAnual, aliquotaEfetiva: round2(efetiva), faixa };
}

/**
 * Calcula INSS de forma progressiva sobre a base informada.
 * @param {number} base
 * @returns {number}
 */
// (Funções calcularINSSProgressivo e calcularIRRF foram migradas para módulos inss.js e irrf.js.)
