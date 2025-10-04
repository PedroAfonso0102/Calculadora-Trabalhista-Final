/**
 * @file Módulo central para cálculos trabalhistas, contendo a lógica de negócio
 * para a maioria das calculadoras da aplicação.
 * @module core/calculations
 */

// Funções de cálculo puras, sem efeitos colaterais.
/**
 * Lógica de negócio e parâmetros de cálculo.
 * Centraliza constantes, tabelas e regras de negócio, servindo como
 * fonte única para valores e configurações legais.
 */

// Base de cálculo para adicionais (ex: insalubridade)
export const BASES_DE_CALCULO = {
    SALARIO_MINIMO: 'SALARIO_MINIMO',
    SALARIO_BRUTO: 'SALARIO_BRUTO',
};

// Parâmetros específicos remanescentes aqui devem ser buscados do parametersStore.

// Parâmetros do Salário Família
export const SALARIO_FAMILIA_LIMIT = 1819.26; // Limite de renda para ter direito
export const SALARIO_FAMILIA_VALUE = 62.04;  // Valor por filho

// Outros parâmetros legais e de negócio
export const PARAMETROS_2025 = {
    ADICIONAL_PERICULOSIDADE: 0.30, // 30%
};

import { calcularINSS } from './inss.js';
import { ajustarBaseIRRF, calcularIRRFBase } from './irrf.js';
import { getSalarioMinimo, getIRRF, getIRRFDeducaoDependente } from './parametersStore.js';
import { calcularFGTSFerias } from './fgts.js';
import { round2 } from './round.js';

/**
 * @typedef {Object} FeriasState
 * @property {number} diasFerias - O número de dias de férias.
 * @property {number} salarioBruto - O salário bruto do funcionário.
 * @property {boolean} abonoPecuniario - Se o funcionário optou pelo abono pecuniário.
 * @property {boolean} adiantarDecimo - Se o funcionário optou por adiantar a primeira parcela do 13º salário.
 * @property {number} mediaHorasExtras - A média de horas extras do funcionário.
 * @property {number} mediaAdicionalNoturno - A média de adicional noturno do funcionário.
 * @property {boolean} adicionalPericulosidade - Se o funcionário recebe adicional de periculosidade.
 * @property {string} adicionalInsalubridadeGrau - O grau do adicional de insalubridade ('minimo', 'medio', 'maximo').
 * @property {string} insalubridadeBase - A base de cálculo da insalubridade ('SALARIO_MINIMO' ou 'SALARIO_BRUTO').
 * @property {number} dependentes - O número de dependentes para fins de IRRF.
 */

/**
 * @typedef {Object} FeriasResult
 * @property {number} diasFerias - Número de dias de férias.
 * @property {number} salarioBruto - Salário bruto.
 * @property {number} mediaHorasExtras - Média de horas extras.
 * @property {number} mediaAdicionalNoturno - Média de adicional noturno.
 * @property {number} periculosidade - Valor do adicional de periculosidade.
 * @property {number} insalubridade - Valor do adicional de insalubridade.
 * @property {number} baseComMedias - Base de cálculo incluindo médias e adicionais.
 * @property {number} valorDia - Valor do dia de trabalho.
 * @property {number} remuneracaoDiasFerias - Remuneração correspondente aos dias de férias.
 * @property {number} adicionalUmTerco - Valor do adicional de 1/3 sobre as férias.
 * @property {number} valorAbono - Valor do abono pecuniário (venda de 10 dias).
 * @property {number} decimoAdiantado - Valor do adiantamento do 13º salário.
 * @property {number} segmentoFerias - Total bruto das férias (remuneração + 1/3).
 * @property {number} segmentoAbono - Valor do abono.
 * @property {number} segmentoDecimoAdiantado - Valor do adiantamento do 13º.
 * @property {number} brutoReferencial - Bruto usado como referência para descontos.
 * @property {number} brutoTotal - Valor bruto total a ser pago.
 * @property {number} baseINSS - Base de cálculo para o INSS.
 * @property {number} inss - Valor do desconto do INSS.
 * @property {number} baseIRRF - Base de cálculo para o IRRF.
 * @property {number} irrf - Valor do desconto do IRRF.
 * @property {number} liquidoSegmentoFerias - Valor líquido apenas das férias.
 * @property {number} liquidoComAbono - Valor líquido das férias mais o abono.
 * @property {number} liquidoComTudo - Valor líquido total a receber.
 * @property {number} dependentes - Número de dependentes.
 * @property {number} deducaoDependentes - Valor da dedução por dependentes no IRRF.
 * @property {Array<object>} inssBreakdown - Detalhamento do cálculo do INSS por faixas.
 * @property {object} irrfFaixa - Faixa de alíquota do IRRF aplicada.
 * @property {object} fgts - Objeto com o cálculo do FGTS sobre as férias.
 * @property {string[]} warnings - Avisos sobre o cálculo.
 */

/**
 * Calcula os valores relacionados às férias de um funcionário.
 * @param {FeriasState} feriasState - O estado da calculadora de férias.
 * @returns {FeriasResult} Um objeto com todos os valores calculados para as férias.
 */
export function calculateFerias(feriasState) {
    if (!feriasState) return {};
    let diasFerias = Number(feriasState.diasFerias) || 0;
    const salarioBruto = Number(feriasState.salarioBruto) || 0;
    const abonoPecuniario = !!feriasState.abonoPecuniario;
    const adiantarDecimo = !!feriasState.adiantarDecimo;
    const mediaHorasExtras = Number(feriasState.mediaHorasExtras) || 0;
    const mediaAdicionalNoturno = Number(feriasState.mediaAdicionalNoturno) || 0;
    const adicionalPericulosidade = !!feriasState.adicionalPericulosidade;
    const adicionalInsalubridadeGrau = feriasState.adicionalInsalubridadeGrau || '0';
    const insalubridadeBase = feriasState.insalubridadeBase || BASES_DE_CALCULO.SALARIO_MINIMO;
    const warnings = [];
    if (diasFerias < 0) { warnings.push('Dias de férias não pode ser negativo. Ajustado para 0.'); diasFerias = 0; }
    if (diasFerias > 30) { warnings.push('Dias de férias acima de 30. Ajustado para 30.'); diasFerias = 30; }
    if (abonoPecuniario && diasFerias < 20) { warnings.push('Venda de 1/3 (abono) geralmente implica usufruir 20 dias ou mais. Verifique.'); }

    // Adicionais de Periculosidade e Insalubridade
    const periculosidade = adicionalPericulosidade ? round2(salarioBruto * 0.30) : 0;
    const grau = String(adicionalInsalubridadeGrau).toLowerCase();
    const refBaseInsalubridade = (insalubridadeBase === BASES_DE_CALCULO.SALARIO_BRUTO) ? salarioBruto : getSalarioMinimo();
    const percIns = grau === 'minimo' || grau === 'mínimo' || grau === 'm' ? 0.10 : (grau === 'medio' || grau === 'médio' ? 0.20 : (grau === 'maximo' || grau === 'máximo' ? 0.40 : 0));
    const insalubridade = round2(refBaseInsalubridade * percIns);

    const baseComMedias = salarioBruto + mediaHorasExtras + mediaAdicionalNoturno + periculosidade + insalubridade;
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

    // Avisos sobre regras fiscais específicas.
    if (segmentoAbono > 0) {
        warnings.push('Abono pecuniário excluído das bases INSS/IRRF (tratado como indenizatório).');
    }
    if (segmentoDecimoAdiantado > 0) {
        warnings.push('Adiantamento de 13º exibido mas não integrado às bases de férias para INSS/IRRF.');
    }

    // FGTS sobre o valor das férias.
    const fgtsObj = calcularFGTSFerias(segmentoFerias);

    return {
        diasFerias,
        salarioBruto,
        mediaHorasExtras,
        mediaAdicionalNoturno,
        periculosidade,
        insalubridade,
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

// --- Calculadoras Adicionais ---
import { calcularRescisao } from './rescisao.js'; // potencial reutilização futura

import { trData } from '../data/tr-data.js';

/**
 * @typedef {Object} FgtsState
 * @property {number} salarioBruto - O salário bruto para base de cálculo do depósito mensal.
 * @property {number} saldoFgts - O saldo inicial do FGTS.
 * @property {string} dataInicio - A data de início do período de cálculo (formato 'MM/YYYY').
 * @property {string} dataFim - A data de fim do período de cálculo (formato 'MM/YYYY').
 */

/**
 * @typedef {Object} FgtsResult
 * @property {number} salarioBruto - Salário bruto informado.
 * @property {number} saldoFgts - Saldo inicial do FGTS informado.
 * @property {string} dataInicio - Data de início do período.
 * @property {string} dataFim - Data de fim do período.
 * @property {number} mesesContribuicao - Número de meses no período.
 * @property {number} depositoMensal - Valor do depósito mensal de FGTS.
 * @property {number} saldoFinalEstimado - Saldo final sem considerar juros.
 * @property {number} saldoComJuros - Saldo final estimado com juros (TR + 3% a.a.).
 * @property {string[]} warnings - Avisos sobre o cálculo.
 */

/**
 * Calcula a estimativa de saldo do FGTS com base em um período e saldo anterior.
 * @param {FgtsState} fgtsState - O estado da calculadora de FGTS.
 * @returns {FgtsResult|null} Um objeto com os detalhes do cálculo do FGTS ou nulo se o estado for inválido.
 */
export function calculateFGTS(fgtsState) {
    if (!fgtsState) return null;

    const salarioBruto = Number(fgtsState.salarioBruto) || 0;
    const saldoFgts = Number(fgtsState.saldoFgts) || 0;
    const dataInicioStr = fgtsState.dataInicio || '';
    const dataFimStr = fgtsState.dataFim || '';

    const parseDate = (str) => {
        if (!str || !/^\d{2}\/\d{4}$/.test(str)) return null;
        const [mes, ano] = str.split('/').map(Number);
        return new Date(ano, mes - 1, 1);
    };

    const dataInicio = parseDate(dataInicioStr);
    const dataFim = parseDate(dataFimStr);

    if (!dataInicio || !dataFim || dataFim < dataInicio) {
        return { warnings: ['Por favor, insira um período válido (mês/ano).'] };
    }

    const depositoMensal = round2(salarioBruto * 0.08);
    let saldoAcumulado = saldoFgts;
    let mesesContribuicao = 0;

    const trMap = new Map(trData.map(item => {
        const [_, mes, ano] = item.data.split('/');
        return [`${mes}/${ano}`, parseFloat(item.valor) / 100];
    }));

    let currentDate = new Date(dataInicio.getFullYear(), dataInicio.getMonth(), 1);

    while (currentDate <= dataFim) {
        mesesContribuicao++;

        // Aplica juros (TR + 3% a.a.) ao saldo do mês anterior
        const mes = String(currentDate.getMonth() + 1).padStart(2, '0');
        const ano = currentDate.getFullYear();
        const trMensal = trMap.get(`${mes}/${ano}`) || 0;
        const jurosMensais = trMensal + (0.03 / 12);
        saldoAcumulado *= (1 + jurosMensais);

        // Adiciona o depósito do mês
        saldoAcumulado += depositoMensal;

        currentDate.setMonth(currentDate.getMonth() + 1);
    }

    const saldoFinalEstimado = saldoFgts + (depositoMensal * mesesContribuicao);

    return {
        salarioBruto,
        saldoFgts,
        dataInicio: dataInicioStr,
        dataFim: dataFimStr,
        mesesContribuicao,
        depositoMensal,
        saldoFinalEstimado: round2(saldoFinalEstimado),
        saldoComJuros: round2(saldoAcumulado),
        warnings: []
    };
}

/**
 * @typedef {Object} PisState
 * @property {number} mesesTrabalhadosAno - O número de meses trabalhados no ano base.
 * @property {number} salarioMensalMedio - O salário mensal médio do trabalhador.
 */

/**
 * @typedef {Object} PisResult
 * @property {number} meses - Meses trabalhados no ano.
 * @property {number} salarioMedio - Salário médio informado.
 * @property {number} salarioMinimoRef - Salário mínimo de referência para o cálculo.
 * @property {boolean} elegivel - Indica se o trabalhador é elegível ao abono.
 * @property {number} valorIntegral - Valor do abono para 12 meses trabalhados.
 * @property {number} valorProporcional - Valor do abono proporcional aos meses trabalhados.
 */

/**
 * Calcula o valor do abono salarial PIS/PASEP de forma simplificada.
 * @param {PisState} pisState - O estado da calculadora de PIS/PASEP.
 * @param {object} legalTexts - Textos legais (não utilizado diretamente no cálculo).
 * @returns {PisResult|null} Um objeto com os detalhes do cálculo do PIS/PASEP ou nulo se o estado for inválido.
 */
export function calculatePISPASEP(pisState, legalTexts){
    if (!pisState) return null;
    const meses = Math.min(12, Math.max(0, Number(pisState.mesesTrabalhadosAno)||0));
    const salarioMedio = Number(pisState.salarioMensalMedio)||Number(pisState.salarioBruto)||0;
    const salarioMinimoRef = getSalarioMinimo();
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

/**
 * @typedef {Object} SeguroDesempregoState
 * @property {number} salario1 - O último salário.
 * @property {number} salario2 - O penúltimo salário.
 * @property {number} salario3 - O antepenúltimo salário.
 * @property {number} mesesTrabalhados - O número de meses trabalhados nos últimos 36 meses.
 * @property {number} numeroSolicitacoes - O número de vezes que o seguro-desemprego já foi solicitado.
 */

/**
 * @typedef {Object} SeguroDesempregoResult
 * @property {number} mediaSalarial - Média dos 3 últimos salários.
 * @property {number} mesesTrabalhados - Meses trabalhados informados.
 * @property {number} numeroSolicitacoes - Número de solicitações anteriores.
 * @property {number} valorParcela - Valor de cada parcela do seguro-desemprego.
 * @property {number} numeroParcelas - Número de parcelas a receber.
 * @property {number} valorTotal - Valor total a ser recebido.
 */

/**
 * Calcula o valor do seguro-desemprego com base nos últimos salários e tempo de trabalho.
 * @param {SeguroDesempregoState} sdState - O estado da calculadora de seguro-desemprego.
 * @returns {SeguroDesempregoResult|null} Um objeto com os detalhes do cálculo do seguro-desemprego ou nulo se o estado for inválido.
 */
export function calculateSeguroDesemprego(sdState) {
    if (!sdState) return null;

    const salario1 = Number(sdState.salario1) || 0;
    const salario2 = Number(sdState.salario2) || 0;
    const salario3 = Number(sdState.salario3) || 0;
    const mesesTrabalhados = Math.max(0, Number(sdState.mesesTrabalhados) || 0);
    const numeroSolicitacoes = Math.max(0, Number(sdState.numeroSolicitacoes) || 0);

    const mediaSalarial = (salario1 + salario2 + salario3) / 3;

    // Regras de 2025 para o valor da parcela
    const FAIXA_1 = 2138.76;
    const FAIXA_2 = 3564.96;
    const FATOR_FAIXA_1 = 0.8;
    const FATOR_FAIXA_2 = 0.5;
    const VALOR_FIXO_FAIXA_2 = 1711.01;
    const TETO_PARCELA = 2424.11;
    const SALARIO_MINIMO = 1518.00;

    let valorParcela = 0;
    if (mediaSalarial <= FAIXA_1) {
        valorParcela = mediaSalarial * FATOR_FAIXA_1;
    } else if (mediaSalarial <= FAIXA_2) {
        valorParcela = (mediaSalarial - FAIXA_1) * FATOR_FAIXA_2 + VALOR_FIXO_FAIXA_2;
    } else {
        valorParcela = TETO_PARCELA;
    }

    valorParcela = Math.max(valorParcela, SALARIO_MINIMO);
    valorParcela = round2(valorParcela);

    // Regras para o número de parcelas
    let numeroParcelas = 0;
    if (numeroSolicitacoes === 0) { // Primeira solicitação
        if (mesesTrabalhados >= 24) numeroParcelas = 5;
        else if (mesesTrabalhados >= 12) numeroParcelas = 4;
    } else if (numeroSolicitacoes === 1) { // Segunda solicitação
        if (mesesTrabalhados >= 24) numeroParcelas = 5;
        else if (mesesTrabalhados >= 12) numeroParcelas = 4;
        else if (mesesTrabalhados >= 9) numeroParcelas = 3;
    } else { // Terceira ou mais solicitações
        if (mesesTrabalhados >= 24) numeroParcelas = 5;
        else if (mesesTrabalhados >= 12) numeroParcelas = 4;
        else if (mesesTrabalhados >= 6) numeroParcelas = 3;
    }

    const valorTotal = round2(valorParcela * numeroParcelas);

    return {
        mediaSalarial: round2(mediaSalarial),
        mesesTrabalhados,
        numeroSolicitacoes,
        valorParcela,
        numeroParcelas,
        valorTotal,
    };
}

/**
 * @typedef {Object} HorasExtrasState
 * @property {number} salarioBruto - O salário bruto do funcionário.
 * @property {number} mediaHorasExtras - A média de horas extras.
 * @property {number} mediaAdicionalNoturno - A média de adicional noturno.
 * @property {number} cargaHorariaMensal - A carga horária mensal do funcionário.
 * @property {number} horasExtras - O número de horas extras a serem calculadas.
 * @property {number} percentualAdicional - O percentual de adicional sobre a hora normal.
 */

/**
 * @typedef {Object} HorasExtrasResult
 * @property {number} carga - Carga horária mensal.
 * @property {number} valorHora - Valor da hora normal de trabalho.
 * @property {number} horasExtras - Quantidade de horas extras.
 * @property {number} adicionalPercent - Percentual do adicional de hora extra.
 * @property {number} valorHoras - Valor total a ser pago pelas horas extras.
 */

/**
 * Calcula o valor de horas extras com base no salário e no percentual de adicional.
 * @param {HorasExtrasState} heState - O estado da calculadora de horas extras.
 * @returns {HorasExtrasResult|null} Um objeto com os detalhes do cálculo de horas extras ou nulo se o estado for inválido.
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

/**
 * @typedef {Object} InssState
 * @property {number} salarioBruto - O salário bruto para o cálculo.
 */

/**
 * @typedef {Object} InssResult
 * @property {number} salario - Salário bruto informado.
 * @property {number} contribuicao - Valor da contribuição do INSS.
 * @property {Array<object>} faixas - Detalhamento do cálculo do INSS por faixas.
 */

/**
 * Calcula a contribuição do INSS para um dado salário.
 * @param {InssState} inssState - O estado da calculadora de INSS.
 * @returns {InssResult|null} Um objeto com o valor da contribuição e o detalhamento por faixas, ou nulo se o estado for inválido.
 */
export function calculateINSSCalculator(inssState){
    if (!inssState) return null;
    const salario = Number(inssState.salarioBruto)||0;
    if (!salario) return null;
    const inssObj = calcularINSS(salario);
    return { salario, contribuicao: inssObj.valor, faixas: inssObj.faixas };
}

/**
 * @typedef {Object} ValeTransporteState
 * @property {number} salarioBruto - O salário bruto do funcionário.
 * @property {number} custoDiarioTransporte - O custo diário com transporte.
 * @property {number} diasTrabalhoMes - O número de dias de trabalho no mês.
 * @property {number} percentualDescontoEmpregado - O percentual de desconto no salário do empregado.
 */

/**
 * @typedef {Object} ValeTransporteResult
 * @property {number} salario - Salário bruto.
 * @property {number} custoDiario - Custo diário do transporte.
 * @property {number} dias - Dias de trabalho no mês.
 * @property {number} percentual - Percentual de desconto.
 * @property {number} custoTotal - Custo total do transporte no mês.
 * @property {number} descontoMax - Desconto máximo permitido por lei (6% do salário).
 * @property {number} descontoEmpregado - Valor efetivamente descontado do empregado.
 * @property {number} subsidioEmpresa - Valor que a empresa paga (custeia).
 */

/**
 * Calcula o desconto do vale-transporte e o subsídio da empresa.
 * @param {ValeTransporteState} vtState - O estado da calculadora de vale-transporte.
 * @returns {ValeTransporteResult|null} Um objeto com os detalhes do cálculo do vale-transporte ou nulo se o estado for inválido.
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

/**
 * @typedef {Object} IrpfState
 * @property {number} salarioBruto - O salário bruto mensal.
 * @property {number} dependentes - O número de dependentes.
 * @property {number} outrasDeducoes - O valor de outras deduções anuais (saúde, educação, etc.).
 * @property {number} pensaoAlimenticia - O valor anual pago em pensão alimentícia.
 * @property {number} contribuicaoPrevidenciaOficial - A contribuição anual para a previdência oficial.
 * @property {number} contribuicaoPrevidenciaPrivada - A contribuição anual para a previdência privada.
 * @property {number} rendimento13 - O valor do 13º salário.
 * @property {number} rendimentoFerias - O valor das férias.
 */

/**
 * @typedef {Object} IrpfResult
 * @property {number} rendimentoAnual - Rendimento tributável anual.
 * @property {number} deducoesTotais - Total de deduções anuais.
 * @property {number} base - Base de cálculo anual do imposto.
 * @property {number} impostoAnual - Valor estimado do imposto de renda anual.
 * @property {number} aliquotaEfetiva - Alíquota efetiva de imposto sobre o rendimento.
 * @property {object} faixa - Faixa de alíquota do IRPF aplicada.
 */

/**
 * Estima o Imposto de Renda de Pessoa Física (IRPF) anual de forma simplificada.
 * @param {IrpfState} irpfState - O estado da calculadora de IRPF.
 * @returns {IrpfResult|null} Um objeto com a estimativa do IRPF anual ou nulo se o estado for inválido.
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
    const deducaoDependentesAno = dependentes * getIRRFDeducaoDependente() * 12;
    const deducoesTotais = outrasDeducoes + pensao + prevOficial + prevPrivada + deducaoDependentesAno;
    const base = Math.max(0, rendimentoAnual - deducoesTotais);
    // Usa tabela mensal escalada: aplica faixa sobre base/12 e multiplica
    const baseMensal = base/12;
    const tabela = getIRRF();
    const faixa = tabela.find(f => baseMensal <= f.limit) || tabela[tabela.length-1];
    const impostoMensal = Math.max(0, baseMensal * faixa.rate - faixa.deduction);
    const impostoAnual = round2(impostoMensal * 12);
    const efetiva = base > 0 ? (impostoAnual/base)*100 : 0;
    return { rendimentoAnual: round2(rendimentoAnual), deducoesTotais: round2(deducoesTotais), base: round2(base), impostoAnual, aliquotaEfetiva: round2(efetiva), faixa };
}

/**
 * Calcula INSS de forma progressiva sobre a base informada.
 * @param {number} base - A base de cálculo para o INSS (salário bruto).
 * @returns {number} O valor da contribuição do INSS.
 */
// Funções de cálculo de INSS e IRRF foram migradas para seus próprios módulos.

/**
 * @typedef {Object} SalarioLiquidoState
 * @property {number} salarioBruto - O salário bruto.
 * @property {number} dependentes - O número de dependentes.
 * @property {boolean} adicionalPericulosidade - Se recebe adicional de periculosidade.
 * @property {string} insalubridadeGrau - O grau de insalubridade ('minimo', 'medio', 'maximo').
 * @property {string} insalubridadeBase - A base de cálculo da insalubridade.
 * @property {number} cargaHorariaMensal - A carga horária mensal.
 * @property {number} horasExtras - O número de horas extras.
 * @property {number} horasNoturnas - O número de horas noturnas.
 * @property {number} descontoVt - O desconto de vale-transporte.
 * @property {number} descontoVr - O desconto de vale-refeição.
 * @property {number} descontoSaude - O desconto do plano de saúde.
 * @property {number} descontoAdiantamentos - O desconto de adiantamentos.
 * @property {boolean} recebeSalarioFamilia - Se recebe salário família.
 * @property {number} filhosSalarioFamilia - O número de filhos para o salário família.
 */

/**
 * @typedef {Object} SalarioLiquidoResult
 * @property {number} salarioBruto - Salário bruto.
 * @property {number} adicionalPericulosidade - Valor do adicional de periculosidade.
 * @property {number} insalubridade - Valor do adicional de insalubridade.
 * @property {number} valorHorasExtras - Valor das horas extras.
 * @property {number} adicionalNoturno - Valor do adicional noturno.
 * @property {number} bruto - Salário bruto total (com adicionais).
 * @property {number} inss - Valor do desconto do INSS.
 * @property {number} baseIRRF - Base de cálculo do IRRF.
 * @property {number} irrf - Valor do desconto do IRRF.
 * @property {number} deducaoDependentes - Valor da dedução por dependentes no IRRF.
 * @property {number} descontoVt - Desconto de vale-transporte.
 * @property {number} descontoVr - Desconto de vale-refeição.
 * @property {number} descontoSaude - Desconto do plano de saúde.
 * @property {number} descontoAdiantamentos - Desconto de adiantamentos.
 * @property {number} totalDescontos - Soma de todos os descontos.
 * @property {number} salarioFamilia - Valor do benefício de salário família.
 * @property {number} liquido - Salário líquido a receber.
 * @property {Array<object>} inssBreakdown - Detalhamento do cálculo do INSS por faixas.
 * @property {object} irrfFaixa - Faixa de alíquota do IRRF aplicada.
 */

/**
 * Calcula o salário líquido mensal a partir do salário bruto e outros proventos e descontos.
 * @param {SalarioLiquidoState} s - O estado da calculadora de salário líquido.
 * @returns {SalarioLiquidoResult|null} Um objeto com o detalhamento do cálculo do salário líquido ou nulo se o estado for inválido.
 */
export function calculateSalarioLiquido(s){
    if (!s) return null;
    const salario = Number(s.salarioBruto)||0;
    if (!salario) return null;
    const dependentes = Number(s.dependentes)||0;
    const adicionalPericulosidade = s.adicionalPericulosidade ? round2(salario * PARAMETROS_2025.ADICIONAL_PERICULOSIDADE) : 0;
    // Insalubridade: percentual por grau sobre base definida
    const grau = String(s.insalubridadeGrau||'0').toLowerCase();
    const refBase = (s.insalubridadeBase === BASES_DE_CALCULO.SALARIO_BRUTO) ? salario : getSalarioMinimo();
    const percIns = grau === 'minimo' || grau === 'mínimo' || grau === 'm' ? 0.10 : (grau === 'medio' || grau === 'médio' ? 0.20 : (grau === 'maximo' || grau === 'máximo' ? 0.40 : 0));
    const insalubridade = round2(refBase * percIns);
    // Horas extras e adicional noturno
    const carga = Math.max(1, Number(s.cargaHorariaMensal)||220);
    const valorHora = salario / carga;
    const horasExtras = Math.max(0, Number(s.horasExtras)||0);
    const horasNoturnas = Math.max(0, Number(s.horasNoturnas)||0);
    const valorHorasExtras = round2(horasExtras * valorHora * 1.5); // 50%
    const adicionalNoturno = round2(horasNoturnas * valorHora * 0.2); // 20%
    // Bruto total da folha
    const bruto = round2(salario + adicionalPericulosidade + insalubridade + valorHorasExtras + adicionalNoturno);
    // INSS e IRRF
    const inssObj = calcularINSS(bruto);
    const inss = inssObj.valor;
    const baseIRRFPre = Math.max(0, bruto - inss);
    const { base: baseIRRF, deducaoDependentes } = ajustarBaseIRRF(baseIRRFPre, dependentes);
    const irrfObj = calcularIRRFBase(baseIRRF);
    const irrf = irrfObj.valor;
    // Descontos informados
    const descontoVt = Number(s.descontoVt)||0;
    const descontoVr = Number(s.descontoVr)||0;
    const descontoSaude = Number(s.descontoSaude)||0;
    const descontoAdiantamentos = Number(s.descontoAdiantamentos)||0;
    const descontosInformados = round2(descontoVt + descontoVr + descontoSaude + descontoAdiantamentos);
    // Salário família (benefício)
    const recebeSF = !!s.recebeSalarioFamilia;
    const filhos = Math.max(0, Number(s.filhosSalarioFamilia)||0);
    const elegivelSF = recebeSF && bruto <= SALARIO_FAMILIA_LIMIT && filhos > 0;
    const salarioFamilia = elegivelSF ? round2(filhos * SALARIO_FAMILIA_VALUE) : 0;
    // Líquido
    const descontosObrig = round2(inss + irrf);
    const totalDescontos = round2(descontosObrig + descontosInformados);
    const liquido = round2(bruto - totalDescontos + salarioFamilia);
    return {
        salarioBruto: round2(salario),
        adicionalPericulosidade,
        insalubridade,
        valorHorasExtras,
        adicionalNoturno,
        bruto,
        inss,
        baseIRRF,
        irrf,
        deducaoDependentes,
        descontoVt: round2(descontoVt),
        descontoVr: round2(descontoVr),
        descontoSaude: round2(descontoSaude),
        descontoAdiantamentos: round2(descontoAdiantamentos),
        totalDescontos,
        salarioFamilia,
        liquido,
        inssBreakdown: inssObj.faixas,
        irrfFaixa: irrfObj.faixa
    };
}

// Nomes em PT-BR (mantendo compatibilidade com nomes em inglês)
export const calcularFerias = calculateFerias;
export const calcularFGTS = calculateFGTS;
export const calcularPISPASEP = calculatePISPASEP;
export const calcularSeguroDesemprego = calculateSeguroDesemprego;
export const calcularHorasExtras = calculateHorasExtras;
export const calcularCalculadoraINSS = calculateINSSCalculator;
export const calcularValeTransporte = calculateValeTransporte;
export const calcularIRPF = calculateIRPF;
export const calcularSalarioLiquido = calculateSalarioLiquido;
