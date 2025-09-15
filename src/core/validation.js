// Regras de validação de dados.
/**
 * Validation Module
 *
 * Centralizes all validation logic for the application following DRY principles.
 * This module consolidates field validation, form validation, and business rules.
 */

import { DateFormatter } from '../services/formatter.js';

/**
 * Validation Engine Class
 * Manages validation rules, executes validations, and provides standardized feedback.
 */
export class ValidationEngine {
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
        // ... add other rules as needed
    };

    /**
     * Validates a single field.
     * @param {string} fieldName - The name of the field to validate.
     * @param {*} value - The value to validate.
     * @param {object} [allValues=null] - The entire state object for cross-field validation.
     * @returns {{isValid: boolean, message: string|null}}
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
     * Validates an entire calculator state object.
     * @param {string} calculatorName - The name of the calculator (e.g., 'ferias').
     * @param {object} calculatorState - The state object for that calculator.
     * @returns {{isValid: boolean, errors: object}}
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
