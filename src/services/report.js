/**
 * @file Serviço de Histórico e Relatórios.
 * @module services/report
 * @description Este módulo gerencia o histórico de cálculos, salvando e recuperando
 * entradas do `localStorage`. Ele fornece funções para obter o histórico, adicionar
 * novas entradas e limpar todos os registros.
 */

import { getStorageItem, setStorageItem } from './storage.js';

/**
 * A chave usada para armazenar o histórico de cálculos no `localStorage`.
 * O versionamento na chave (`v1`) permite futuras migrações de formato sem
 * conflito com dados antigos.
 * @private
 * @const {string}
 */
const HISTORY_KEY = 'trabalhista:history:v1';

/**
 * Obtém o histórico de cálculos armazenado no `localStorage`.
 * @public
 * @param {number} [limit=50] - O número máximo de entradas do histórico a serem retornadas.
 * @returns {Array<object>} Uma lista de entradas do histórico, onde cada entrada é um objeto
 * contendo os detalhes de um cálculo passado. Retorna um array vazio se não houver histórico.
 */
export function getHistory(limit = 50) {
	const arr = getStorageItem(HISTORY_KEY, []);
	return Array.isArray(arr) ? arr.slice(0, limit) : [];
}

/**
 * @typedef {object} HistoryEntry
 * @property {string} id - Um ID único para a entrada do histórico.
 * @property {string} calc - O nome da calculadora usada (ex: 'ferias').
 * @property {string} when - A data e hora do cálculo no formato ISO 8601.
 * @property {object} input - O objeto de estado de entrada usado para o cálculo.
 * @property {object} result - O objeto de resultado do cálculo.
 */

/**
 * Adiciona uma nova entrada ao histórico de cálculos no `localStorage`.
 * A lista de histórico é limitada a 100 entradas para evitar o uso excessivo de armazenamento.
 * @public
 * @param {string} calcName - O nome da calculadora (ex: 'ferias').
 * @param {object} inputState - O objeto de estado de entrada que foi usado para o cálculo.
 * @param {object} result - O objeto de resultado retornado pelo cálculo.
 * @returns {string} O ID único da nova entrada do histórico criada.
 */
export function appendHistoryEntry(calcName, inputState, result) {
	const now = new Date().toISOString();
	const entry = {
		id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
		calc: calcName,
		when: now,
		input: inputState,
		result
	};
	const list = getHistory(1000); // Pega um número maior para não perder entradas ao adicionar
	list.unshift(entry);
	setStorageItem(HISTORY_KEY, list.slice(0, 100)); // Limita o histórico a 100 entradas
	return entry.id;
}

/**
 * Limpa completamente todo o histórico de cálculos do `localStorage`.
 * @public
 */
export function clearHistory() {
	setStorageItem(HISTORY_KEY, []);
}

/**
 * Módulo de Relatórios (Placeholder).
 *
 * Esta seção é um placeholder para futuras funcionalidades de geração de relatórios
 * em HTML, que seriam usadas para impressão ou visualização detalhada.
 */

// [ANÁLISE PREDITIVA]: Este arquivo conterá funções como generateReportHTML,
// que serão chamadas por events.js quando o usuário clicar em um botão de impressão.
// Importará funções de formatação para exibir os dados corretamente.

console.log('Serviço report.js carregado.');

/**
 * Alias de `getHistory` em português.
 * @type {typeof getHistory}
 */
export const obterHistorico = getHistory;
/**
 * Alias de `appendHistoryEntry` em português.
 * @type {typeof appendHistoryEntry}
 */
export const adicionarEntradaHistorico = appendHistoryEntry;
/**
 * Alias de `clearHistory` em português.
 * @type {typeof clearHistory}
 */
export const limparHistorico = clearHistory;
