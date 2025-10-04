/**
 * @file Módulo de Formatação e Utilitários.
 * @module services/formatter
 * @description Centraliza todas as funções de formatação, parsing e utilidades de UI,
 * como formatação de moeda, manipulação de datas, aplicação de máscaras de input
 * e a função de debounce para controle de eventos.
 */

const CURRENCY_LOCALE = 'pt-br';
const CURRENCY_CODE = 'BRL';

/**
 * @class FormatadorMoeda
 * @classdesc Gerencia todas as operações de formatação e parsing de valores monetários,
 * garantindo consistência no tratamento de moeda em toda a aplicação.
 */
export class FormatadorMoeda {
    /**
     * Formata um valor numérico como uma string de moeda no padrão brasileiro (BRL).
     * @param {number} valor - O valor numérico a ser formatado.
     * @returns {string} A string formatada como moeda (ex: "R$ 1.234,56"). Retorna "R$ 0,00" para entradas inválidas.
     */
    static formatar(valor) {
        if (typeof valor !== 'number' || !Number.isFinite(valor)) {
            valor = 0;
        }
        return valor.toLocaleString(CURRENCY_LOCALE, {
            style: 'currency',
            currency: CURRENCY_CODE
        });
    }

    /**
     * Converte uma string de moeda formatada (ex: "R$ 1.234,56") de volta para um número.
     * Remove todos os caracteres não numéricos e converte para um valor de ponto flutuante.
     * @param {string} valor - A string de moeda formatada.
     * @returns {number} O valor numérico correspondente (ex: 1234.56). Retorna 0 para entradas inválidas.
     */
    static desmascarar(valor) {
        if (typeof valor !== 'string' || !valor.trim()) return 0;
        const apenasDigitos = valor.replace(/\D/g, '');
        if (!apenasDigitos) return 0;
        const numero = parseFloat(apenasDigitos) / 100;
        return Number.isFinite(numero) ? numero : 0;
    }

    /** @deprecated Usar `formatar`. */
    static format(valor) { return this.formatar(valor); }
    /** @deprecated Usar `desmascarar`. */
    static unmask(valor) { return this.desmascarar(valor); }
}

/**
 * @class FormatadorData
 * @classdesc Gerencia a formatação, parsing e validação de datas, com foco no formato brasileiro (DD/MM/YYYY).
 */
export class FormatadorData {
    /**
     * Converte uma string de data no formato brasileiro (DD/MM/YYYY) para um objeto `Date` em UTC.
     * @param {string} textoData - A string de data a ser convertida.
     * @returns {Date|null} O objeto `Date` correspondente ou `null` se a string for inválida.
     */
    static analisarBR(textoData) {
        if (typeof textoData !== 'string') return null;
        const m = textoData.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (!m) return null;
        const [_, dd, mm, yyyy] = m;
        const d = Number(dd), mth = Number(mm) - 1, y = Number(yyyy);
        const dt = new Date(Date.UTC(y, mth, d));
        if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mth || dt.getUTCDate() !== d) return null;
        return dt;
    }

    /**
     * Formata um objeto `Date` ou uma string de data compatível com ISO para o formato brasileiro (DD/MM/YYYY).
     * @param {string|Date} valor - A data a ser formatada.
     * @returns {string} A data formatada ou uma string vazia se a entrada for inválida.
     */
    static formatarBR(valor) {
        if (!valor) return '';
        try {
            const data = new Date(valor + 'T00:00:00'); // Assume UTC para evitar problemas de fuso horário.
            if (isNaN(data.getTime())) return '';
            return data.toLocaleDateString(CURRENCY_LOCALE, { timeZone: 'UTC' });
        } catch {
            return '';
        }
    }

    /**
     * Valida se uma string representa uma data válida, aceitando formatos BR (DD/MM/YYYY) e ISO.
     * @param {string} textoData - A string de data a ser validada.
     * @returns {boolean} Retorna `true` se a data for válida, `false` caso contrário.
     */
    static ehDataValida(textoData) {
        if (!textoData) return false;
        if (this.analisarBR(textoData)) return true;
        const data = new Date(textoData);
        return !isNaN(data.getTime());
    }

    /**
     * Valida se um intervalo de datas é válido, ou seja, se a data de início é anterior à data de término.
     * @param {string} textoDataInicio - A string da data de início.
     * @param {string} textoDataFim - A string da data de término.
     * @returns {boolean} Retorna `true` se o intervalo for válido ou se uma das datas não for fornecida.
     */
    static ehIntervaloDataValido(textoDataInicio, textoDataFim) {
        if (!textoDataInicio || !textoDataFim) return true;
        const dataInicio = this.analisarBR(textoDataInicio) || new Date(textoDataInicio);
        const dataFim = this.analisarBR(textoDataFim) || new Date(textoDataFim);
        if (isNaN(dataInicio.getTime()) || isNaN(dataFim.getTime())) return false;
        return dataInicio < dataFim;
    }

    /** @deprecated Usar `analisarBR`. */
    static parseBR(textoData) { return this.analisarBR(textoData); }
    /** @deprecated Usar `formatarBR`. */
    static formatBR(valor) { return this.formatarBR(valor); }
    /** @deprecated Usar `ehDataValida`. */
    static isValidDate(textoData) { return this.ehDataValida(textoData); }
    /** @deprecated Usar `ehIntervaloDataValido`. */
    static isValidDateRange(textoDataInicio, textoDataFim) { return this.ehIntervaloDataValido(textoDataInicio, textoDataFim); }
}

/**
 * @class GerenciadorMascaraInput
 * @classdesc Gerencia a aplicação de máscaras de formatação em tempo real para campos de formulário (`<input>`).
 */
export class GerenciadorMascaraInput {
    /**
     * Aplica uma máscara de moeda a um elemento de input, formatando o valor enquanto o usuário digita.
     * @param {HTMLInputElement} elementoInput - O elemento de input ao qual a máscara será aplicada.
     */
    static aplicarMascaraMoeda(elementoInput) {
        if (!elementoInput) return;
        elementoInput.addEventListener('input', this.manipularInputMoeda);
    }

    /**
     * Manipulador de evento para o input de moeda. Converte o valor digitado para o formato monetário.
     * @private
     * @param {Event} evento - O evento de input.
     */
    static manipularInputMoeda(evento) {
        const input = evento.target;
        let valor = input.value.replace(/\D/g, '');
        if (valor) {
            valor = (parseInt(valor, 10) / 100).toLocaleString(CURRENCY_LOCALE, {
                minimumFractionDigits: 2
            });
            input.value = `R$ ${valor}`;
        } else {
            input.value = '';
        }
    }

    /**
     * Aplica uma máscara de data (DD/MM/YYYY) a um elemento de input.
     * @param {HTMLInputElement} elementoInput - O elemento de input.
     */
    static aplicarMascaraData(elementoInput) {
        if (!elementoInput || elementoInput.dataset.dateMaskBound) return;
        elementoInput.addEventListener('input', (e) => {
            const digitos = e.target.value.replace(/\D/g, '').slice(0, 8);
            let saida = digitos.replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})\/(\d{2})(\d)/, '$1/$2/$3');
            e.target.value = saida;
        });
        try { elementoInput.setAttribute('inputmode', 'numeric'); } catch(_e){}
        elementoInput.dataset.dateMaskBound = '1';
    }

    /**
     * Aplica uma máscara de mês e ano (MM/YYYY) a um elemento de input.
     * @param {HTMLInputElement} elementoInput - O elemento de input.
     */
    static aplicarMascaraMesAno(elementoInput) {
        if (!elementoInput || elementoInput.dataset.monthYearMaskBound) return;
        elementoInput.addEventListener('input', (e) => {
            const digitos = e.target.value.replace(/\D/g, '').slice(0, 6);
            let saida = digitos.replace(/(\d{2})(\d)/, '$1/$2');
            e.target.value = saida;
        });
        try { elementoInput.setAttribute('inputmode', 'numeric'); } catch(_e){}
        elementoInput.dataset.monthYearMaskBound = '1';
    }

    /** @deprecated Usar `aplicarMascaraMoeda`. */
    static applyCurrencyMask(elementoInput) { return this.aplicarMascaraMoeda(elementoInput); }
    /** @deprecated Usar `manipularInputMoeda`. */
    static handleCurrencyInput(evento) { return this.manipularInputMoeda(evento); }
    /** @deprecated Usar `aplicarMascaraData`. */
    static applyDateMask(elementoInput) { return this.aplicarMascaraData(elementoInput); }
    /** @deprecated Usar `aplicarMascaraMesAno`. */
    static applyMonthYearMask(elementoInput) { return this.aplicarMascaraMesAno(elementoInput); }
}

/**
 * Cria uma versão "debounced" de uma função. A função debounced atrasa sua execução
 * até que um certo tempo tenha passado sem que ela seja chamada novamente. Útil para
 * controlar a frequência de execução de eventos como `input` ou `resize`.
 * @param {Function} funcao - A função para aplicar o debounce.
 * @param {number} espera - O tempo de espera em milissegundos antes de executar a função.
 * @returns {Function} A nova função "debounced".
 */
export function atrasar(funcao, espera) {
    let timeout;
    return function funcaoExecutada(...args) {
        const posterior = () => {
            clearTimeout(timeout);
            funcao.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(posterior, espera);
    };
}

// Aliases para compatibilidade com código legado que usa nomes em inglês.
/** @deprecated Usar `FormatadorMoeda`. */
export { FormatadorMoeda as CurrencyFormatter };
/** @deprecated Usar `FormatadorData`. */
export { FormatadorData as DateFormatter };
/** @deprecated Usar `GerenciadorMascaraInput`. */
export { GerenciadorMascaraInput as InputMaskManager };
/** @deprecated Usar `atrasar`. */
export { atrasar as debounce };
