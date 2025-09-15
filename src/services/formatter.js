// Formatação de moeda, datas, etc.
/**
 * Formatter Service
 *
 * This module centralizes all formatting, parsing, and utility functions.
 * It consolidates logic from the previous formatters.js and utils.js files.
 */

const CURRENCY_LOCALE = 'pt-BR';
const CURRENCY_CODE = 'BRL';

/**
 * Manages all currency-related formatting operations.
 */
export class CurrencyFormatter {
    /**
     * Formats a number as Brazilian currency (R$).
     * @param {number} value - The numeric value to format.
     * @returns {string} - The formatted currency string.
     */
    static format(value) {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            value = 0;
        }
        return value.toLocaleString(CURRENCY_LOCALE, {
            style: 'currency',
            currency: CURRENCY_CODE
        });
    }

    /**
     * Removes currency formatting and returns a numeric value.
     * @param {string} value - The formatted currency string.
     * @returns {number} - The numeric value.
     */
    static unmask(value) {
        if (typeof value !== 'string' || !value.trim()) return 0;
        const digitsOnly = value.replace(/\D/g, '');
        if (!digitsOnly) return 0;
        const number = parseFloat(digitsOnly) / 100;
        return Number.isFinite(number) ? number : 0;
    }
}

/**
 * Manages all date-related formatting and validation.
 */
export class DateFormatter {
    /**
     * Formats a date value into Brazilian format (DD/MM/YYYY).
     * @param {string|Date} value - The date to format.
     * @returns {string} - The formatted date string or empty string.
     */
    static formatBR(value) {
        if (!value) return '';
        try {
            const date = new Date(value + 'T00:00:00'); // Assume UTC to avoid timezone issues
            if (isNaN(date.getTime())) return '';
            return date.toLocaleDateString(CURRENCY_LOCALE, { timeZone: 'UTC' });
        } catch {
            return '';
        }
    }

    /**
     * Validates if a string is a valid date.
     * @param {string} dateString - The date string to validate.
     * @returns {boolean} - True if the date is valid.
     */
    static isValidDate(dateString) {
        if (!dateString) return false;
        const date = new Date(dateString);
        return !isNaN(date.getTime());
    }

    /**
     * Validates that the start date is before the end date.
     * @param {string} startDateStr - The start date string.
     * @param {string} endDateStr - The end date string.
     * @returns {boolean} - True if the date range is valid.
     */
    static isValidDateRange(startDateStr, endDateStr) {
        if (!startDateStr || !endDateStr) return true; // Allow validation if one is empty
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return false;
        return startDate < endDate;
    }
}


/**
 * Manages input masks and real-time formatting for form fields.
 */
export class InputMaskManager {
    /**
     * Applies a currency mask to an input element.
     * @param {HTMLInputElement} inputElement - The input element.
     */
    static applyCurrencyMask(inputElement) {
        if (!inputElement) return;
        if (typeof InputMaskManager.handleCurrencyInput === 'function') {
            inputElement.addEventListener('input', InputMaskManager.handleCurrencyInput);
        } else if (typeof this.handleCurrencyInput === 'function') {
            // fallback to 'this' for compatibility
            inputElement.addEventListener('input', this.handleCurrencyInput);
        } else {
            console.error('[formatter] handleCurrencyInput não disponível');
        }
    }

    /**
     * Handles the input event for currency formatting.
     * @private
     */
    static handleCurrencyInput(event) {
        const input = event.target;
        let value = input.value.replace(/\D/g, '');
        value = (parseInt(value, 10) / 100).toLocaleString(CURRENCY_LOCALE, {
            minimumFractionDigits: 2
        });
        if (value === 'NaN') {
            input.value = '';
        } else {
            input.value = `R$ ${value}`;
        }
    }
}

/**
 * Creates a debounced version of a function that delays execution.
 * @param {Function} func - The function to debounce.
 * @param {number} wait - The number of milliseconds to delay.
 * @returns {Function} - The debounced function.
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
