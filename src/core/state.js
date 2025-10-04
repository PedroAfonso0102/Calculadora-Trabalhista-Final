/**
 * @file Gerenciamento de Estado da Aplicação.
 * @module core/state
 * @description Este arquivo define a "fonte única de verdade" (Single Source of Truth) para o estado
 * da aplicação. Ele contém a estrutura de dados inicial para todas as calculadoras,
 * o estado global da UI e a função para atualizar o estado de forma segura.
 */

import { BASES_DE_CALCULO } from './calculations.js';
import { getVisibleCalculators } from '../services/storage.js';

/**
 * Objeto base com campos comuns a várias calculadoras para evitar repetição (DRY principle).
 * @private
 * @type {object}
 * @property {number} salarioBruto - O salário bruto do funcionário.
 * @property {number} dependentes - O número de dependentes para fins de IRRF.
 * @property {boolean} adicionalPericulosidade - Indica se o funcionário recebe adicional de periculosidade.
 * @property {string} insalubridadeGrau - O grau do adicional de insalubridade ('0', 'minimo', 'medio', 'maximo').
 * @property {string} insalubridadeBase - A base de cálculo para a insalubridade.
 * @property {object} errors - Objeto para armazenar erros de validação de campos.
 */
const baseCalculatorState = {
    salarioBruto: 0,
    dependentes: 0,
    adicionalPericulosidade: false,
    insalubridadeGrau: '0',
    insalubridadeBase: BASES_DE_CALCULO.SALARIO_MINIMO,
    errors: {}
};

/**
 * Estende o `baseCalculatorState` com campos de médias de verbas variáveis.
 * @private
 * @type {object}
 */
const extendedCalculatorState = {
    ...baseCalculatorState,
    mediaHorasExtras: 0,
    mediaAdicionalNoturno: 0
};

/**
 * Agrupa campos comuns relacionados a descontos diversos.
 * @private
 * @type {object}
 */
const discountCalculatorState = {
    descontoVt: 0,
    descontoVr: 0,
    descontoSaude: 0,
    descontoAdiantamentos: 0
};

/**
 * Define a estrutura e os valores padrão para o estado inicial de todas as calculadoras.
 * Este objeto é usado para inicializar o estado da aplicação e para resetar
 * os formulários das calculadoras para seus valores padrão.
 * @type {object}
 */
export const initialState = {
    ferias: {
        ...extendedCalculatorState,
        adicionalInsalubridadeGrau: '0',
        diasFerias: 30,
        abonoPecuniario: false,
        adiantarDecimo: false
    },
    rescisao: {
        ...extendedCalculatorState,
        ...discountCalculatorState,
        adicionalInsalubridadeGrau: '0',
        motivo: 'SEM_JUSTA_CAUSA',
        dataAdmissao: '',
        dataDemissao: '',
        saldoFgts: 0,
        avisoPrevio: 'indenizado',
        feriasVencidas: false,
        projetarAvisoParaAvos: false,
        excluirFeriasVencidasMulta: false,
        aplicarReducaoAviso: true
    },
    decimoTerceiro: {
        ...extendedCalculatorState,
        adicionalInsalubridadeGrau: '0',
        mesesTrabalhados: 12,
        adiantamentoRecebido: 0
    },
    salarioLiquido: {
        ...baseCalculatorState,
        ...discountCalculatorState,
        horasExtras: 0,
        horasNoturnas: 0,
        cargaHorariaMensal: 220,
        recebeSalarioFamilia: false,
        filhosSalarioFamilia: 0
    },
    fgts: {
        ...baseCalculatorState,
        saldoFgts: 0,
        mesesTrabalhadosAno: 12,
        aliquota: 0.08,
        distribuicaoLucros: 0
    },
    pisPasep: {
        ...baseCalculatorState,
        mesesTrabalhadosAno: 12,
        salarioMensalMedio: 0,
        recebeuAbonoAnterior: false
    },
    seguroDesemprego: {
        ...baseCalculatorState,
        mesesTrabalhadosUltimos36: 0,
        numeroSolicitacoes: 1,
        mediaSalariosUltimos3: 0
    },
    horasExtras: {
        ...baseCalculatorState,
        horasExtras: 0,
        percentualAdicional: 50,
        diasUteisMes: 22,
        horasDia: 8,
        cargaHorariaMensal: 220
    },
    inss: {
        ...baseCalculatorState,
        mostrarDetalhamento: true
    },
    valeTransporte: {
        ...baseCalculatorState,
        custoDiarioTransporte: 0,
        diasTrabalhoMes: 22,
        percentualDescontoEmpregado: 6
    },
    irpf: {
        ...baseCalculatorState,
        outrasDeducoes: 0,
        pensaoAlimenticia: 0,
        contribuicaoPrevidenciaOficial: 0,
        contribuicaoPrevidenciaPrivada: 0,
        rendimento13: 0,
        rendimentoFerias: 0
    }
};

/**
 * O objeto de estado global e reativo da aplicação.
 * Contém o estado da UI (calculadora ativa, tema), a lista de calculadoras visíveis,
 * uma cópia profunda do `initialState` para os dados dos formulários, e um objeto
 * para armazenar os resultados dos cálculos.
 * @type {object}
 */
export const state = {
    activeCalculator: 'home',
    visibleCalculators: getVisibleCalculators(),
    ui: {
        theme: 'system',
        loading: false
    },
    ...JSON.parse(JSON.stringify(initialState)), // Cópia profunda para prevenir mutação
    results: {} // To store calculation results
};

/**
 * Atualiza um valor no estado global da aplicação de forma segura, usando um
 * caminho com notação de ponto para acessar propriedades aninhadas.
 * @example
 * // Atualiza o salário bruto na calculadora de férias
 * updateState('ferias.salarioBruto', 5000);
 * @param {string} path - O caminho para a propriedade a ser atualizada (ex: "ferias.salarioBruto").
 * @param {*} value - O novo valor para a propriedade.
 */
export function updateState(path, value) {
    const keys = path.split('.');
    let current = state;
    while (keys.length > 1) {
        current = current[keys.shift()];
    }
    current[keys[0]] = value;
}
