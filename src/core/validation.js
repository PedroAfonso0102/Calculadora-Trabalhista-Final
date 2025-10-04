/**
 * @file Módulo de Validação Centralizado.
 * @module core/validation
 * @description Este módulo consolida toda a lógica de validação da aplicação,
 * incluindo validação de campos individuais e de formulários completos,
 * seguindo o princípio DRY (Don't Repeat Yourself).
 */

import { DateFormatter } from '../services/formatter.js';

/**
 * @class ValidationEngine
 * @classdesc Gerencia um conjunto de regras de validação, executa as validações
 * e retorna feedback padronizado para a interface do usuário.
 */
export class ValidationEngine {
    /**
     * Armazena as regras de validação padrão para os campos da aplicação.
     * Cada chave corresponde a um nome de campo, e o valor é um array de funções de validação.
     * Cada função de validação retorna `true` se válida, ou uma string com a mensagem de erro se inválida.
     * @type {Object.<string, Array<function(*, ?object): (boolean|string)>>}
     * @property {Array<Function>} salarioBruto - Regra para o salário bruto.
     * @property {Array<Function>} diasFerias - Regra para os dias de férias.
     * @property {Array<Function>} dataAdmissao - Regras para a data de admissão, incluindo validação de intervalo.
     * @property {Array<Function>} dataDemissao - Regras para a data de demissão, incluindo validação de intervalo.
     * @property {Array<Function>} dependentes - Regra para o número de dependentes.
     * @property {Array<Function>} mesesTrabalhados - Regra para o número de meses trabalhados.
     */
    static STANDARD_RULES = {
        salarioBruto: [(v) => v > 0 || 'Salário deve ser maior que zero.'],
        diasFerias: [(v) => (v >= 1 && v <= 30) || 'Deve estar entre 1 e 30 dias.'],
        dataAdmissao: [
            (v) => !!v || 'Data é obrigatória.',
            (v) => DateFormatter.isValidDate(v) || 'Data inválida.',
            (v, allValues) => !allValues?.dataDemissao || DateFormatter.isValidDateRange(v, allValues.dataDemissao) || 'Admissão deve ser anterior à demissão.'
        ],
        dataDemissao: [
            (v) => !!v || 'Data é obrigatória.',
            (v) => DateFormatter.isValidDate(v) || 'Data inválida.',
            (v, allValues) => !allValues?.dataAdmissao || DateFormatter.isValidDateRange(allValues.dataAdmissao, v) || 'Demissão deve ser posterior à admissão.'
        ],
        dependentes: [(v) => v >= 0 || 'Valor não pode ser negativo.'],
        mesesTrabalhados: [(v) => (v >= 1 && v <= 12) || 'Deve ser entre 1 e 12.'],
        // ... adicione outras regras conforme necessário
    };

    /**
     * @typedef {Object} ValidationResult
     * @property {boolean} isValid - `true` se o valor for válido, `false` caso contrário.
     * @property {string|null} message - A mensagem de erro se a validação falhar, caso contrário `null`.
     */

    /**
     * Valida um único valor de campo com base nas regras definidas em `STANDARD_RULES`.
     * @param {string} fieldName - O nome do campo a ser validado (ex: 'salarioBruto').
     * @param {*} value - O valor do campo a ser validado.
     * @param {object} [allValues=null] - O objeto de estado completo da calculadora, para validações que dependem de outros campos (ex: data de admissão vs. demissão).
     * @returns {ValidationResult} - Um objeto indicando o resultado da validação.
     */
    static validateField(fieldName, value, allValues = null) {
        const rules = this.STANDARD_RULES[fieldName] || [];
        for (const rule of rules) {
            const result = rule(value, allValues);
            if (typeof result === 'string') {
                return { isValid: false, message: result };
            }
        }
        return { isValid: true, message: null };
    }

    /**
     * @typedef {Object} CalculatorValidationResult
     * @property {boolean} isValid - `true` se todos os campos do estado da calculadora forem válidos.
     * @property {Object.<string, string>} errors - Um objeto mapeando nomes de campos para suas respectivas mensagens de erro.
     */

    /**
     * Valida o estado completo de uma calculadora, iterando sobre todos os seus campos.
     * @param {string} calculatorName - O nome da calculadora (ex: 'ferias'), usado para referência futura ou logs.
     * @param {object} calculatorState - O objeto de estado completo para essa calculadora.
     * @returns {CalculatorValidationResult} - Um objeto com o resultado geral da validação e um mapa de erros.
     */
    static validateCalculatorState(calculatorName, calculatorState) {
        const errors = {};
        let isValid = true;

        for (const [field, value] of Object.entries(calculatorState)) {
            const validation = this.validateField(field, value, calculatorState);
            if (!validation.isValid) {
                isValid = false;
                errors[field] = validation.message;
            }
        }

        return { isValid, errors };
    }
}

/**
 * Alias da classe `ValidationEngine` em português para consistência de nomenclatura no projeto.
 * @type {typeof ValidationEngine}
 */
export const MotorValidacao = ValidationEngine;
