// Captura eventos e delega para o estado.
/**
 * Event Listeners Module
 *
 * This module is responsible for attaching all global event listeners
 * and orchestrating the application's response to user input by
 * updating the central state. It does NOT directly manipulate the DOM.
 */

import { updateState, state, initialState } from '../core/state.js';
import { calculateFerias, calculateFGTS, calculatePISPASEP, calculateSeguroDesemprego, calculateHorasExtras, calculateINSSCalculator, calculateValeTransporte, calculateIRPF } from '../core/calculations.js';
import { calcularDecimoTerceiro } from '../core/decimoTerceiro.js';
import { calcularRescisao } from '../core/rescisao.js';
import * as ParamStore from '../core/parametersStore.js';
import { saveState, getSavePreference } from '../services/storage.js';
import { CurrencyFormatter } from '../services/formatter.js';
import { openFaqModal } from '../features/knowledge-base/ui.js';
// [ANALISE PREDITIVA]: Este módulo importará `renderer.js` no futuro para chamar a re-renderização.
// import { renderApp } from '../ui/renderer.js';

const debouncedSaveState = debounce(saveState, 500);

/**
 * Handles all delegated input and change events from form elements.
 * @param {Event} event - The input or change event.
 */
function handleFormInput(event) {
    const element = event.target;
    const path = element.dataset.state; // e.g., "ferias.salarioBruto"

    if (!path) return;

    let value;
    switch (element.type) {
        case 'checkbox':
            value = element.checked;
            break;
        case 'radio':
            value = element.value;
            break;
        case 'text':
            value = element.classList.contains('money-mask')
                ? CurrencyFormatter.unmask(element.value)
                : element.value;
            break;
        default:
            value = element.value;
            break;
    }

    // Update the central state
    updateState(path, value);

    let shouldRender = false;
    const paramsOk = typeof ParamStore.areParametrosLoaded === 'function' ? ParamStore.areParametrosLoaded() : false;
    if (paramsOk) {
        if (path.startsWith('ferias.')) {
            state.results.ferias = calculateFerias(state.ferias);
            shouldRender = true;
        }
        if (path.startsWith('decimoTerceiro.')) {
            state.results.decimoTerceiro = calcularDecimoTerceiro(state.decimoTerceiro);
            shouldRender = true;
        }
        if (path.startsWith('rescisao.')) {
            state.results.rescisao = calcularRescisao(state.rescisao);
            shouldRender = true;
        }
        if (path.startsWith('fgts.')) { state.results.fgts = calculateFGTS(state.fgts); shouldRender = true; }
        if (path.startsWith('pisPasep.')) { state.results.pisPasep = calculatePISPASEP(state.pisPasep, state.legalTexts); shouldRender = true; }
        if (path.startsWith('seguroDesemprego.')) { state.results.seguroDesemprego = calculateSeguroDesemprego(state.seguroDesemprego); shouldRender = true; }
        if (path.startsWith('horasExtras.')) { state.results.horasExtras = calculateHorasExtras(state.horasExtras); shouldRender = true; }
        if (path.startsWith('inss.')) { state.results.inss = calculateINSSCalculator(state.inss); shouldRender = true; }
        if (path.startsWith('valeTransporte.')) { state.results.valeTransporte = calculateValeTransporte(state.valeTransporte); shouldRender = true; }
        if (path.startsWith('irpf.')) { state.results.irpf = calculateIRPF(state.irpf); shouldRender = true; }
    } else {
        // Evita spam de erros; log leve na primeira interação sem parâmetros
        if (!window.__param_warned) {
            console.warn('[events] Ignorando recalculo: parâmetros ainda não carregados');
            window.__param_warned = true;
        }
    }
    if (shouldRender) {
        import('../ui/renderer.js').then(m => m.renderApp());
    }

    // [ANALISE PREDITIVA]: Após a atualização do estado, o renderer será chamado aqui.
    // renderApp();

    console.log(`State updated via ${event.type}:`, path, value); // For debugging

    // Persist state if user has opted in
    if (getSavePreference()) {
        // Filtra apenas subestados conhecidos (ferias, rescisao, decimoTerceiro, salarioLiquido)
        const allowedKeys = Object.keys(initialState);
        const toPersist = {};
        allowedKeys.forEach(k => { toPersist[k] = state[k]; });
        debouncedSaveState(toPersist);
    }
}

/**
 * Creates a debounced version of a function.
 * @param {Function} func The function to debounce.
 * @param {number} delay The debounce delay in milliseconds.
 * @returns {Function} The debounced function.
 */
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * Initializes all global event listeners for the application.
 */
export function initializeEventListeners() {
    // O container raiz real definido em index.html é #app
    const appContainer = document.getElementById('app');
    if (!appContainer) {
        console.error("Event listeners cannot be attached: #app not found.");
        return;
    }

    // Delegate form events
    appContainer.addEventListener('input', handleFormInput);
    appContainer.addEventListener('change', handleFormInput);

    // Listener for opening the Knowledge Base
    const openFaqButton = document.getElementById('open-faq-btn'); // Example button
    if (openFaqButton) {
        openFaqButton.addEventListener('click', openFaqModal);
    }
}
