// Estrutura de dados e estado inicial.
/**
 * State Management
 *
 * This file defines the single source of truth for the application's state.
 * It includes the initial state structure and the function to update it.
 */

// Importa constantes de cálculo da lógica central
import { BASES_DE_CALCULO } from './calculations.js';
import { getVisibleCalculators } from '../services/storage.js';

/**
 * Base objects for common calculator fields following DRY principle
 */
const baseCalculatorState = {
    salarioBruto: 0,
    dependentes: 0,
    periculosidade: false,
    insalubridadeGrau: '0',
    insalubridadeBase: BASES_DE_CALCULO.SALARIO_MINIMO,
    errors: {}
};

const extendedCalculatorState = {
    ...baseCalculatorState,
    mediaHorasExtras: 0,
    mediaAdicionalNoturno: 0
};

const discountCalculatorState = {
    descontoVt: 0,
    descontoVr: 0,
    descontoSaude: 0,
    descontoAdiantamentos: 0
};

/**
 * The initial state shape for the entire application.
 * Used to initialize the state and to reset calculators.
 */
export const initialState = {
    ferias: {
        ...extendedCalculatorState,
        diasFerias: 30,
        abonoPecuniario: false,
        adiantarDecimo: false
    },
    rescisao: {
        ...extendedCalculatorState,
        ...discountCalculatorState,
        motivo: 'sem_justa_causa',
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
        saldoAtual: 0,
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
 * The global application state object.
 * This is the single source of truth.
 */
export const state = {
    activeCalculator: 'ferias',
    visibleCalculators: getVisibleCalculators(),
    ui: {
        theme: 'system',
        loading: false
    },
    ...JSON.parse(JSON.stringify(initialState)), // Deep copy to prevent mutation
    results: {} // To store calculation results
};

/**
 * Updates a value in the application state using a dot-notation path.
 * @param {string} path - The path to the value to update (e.g., "ferias.salarioBruto").
 * @param {*} value - The new value.
 */
export function updateState(path, value) {
    const keys = path.split('.');
    let current = state;
    while (keys.length > 1) {
        current = current[keys.shift()];
    }
    current[keys[0]] = value;
}
