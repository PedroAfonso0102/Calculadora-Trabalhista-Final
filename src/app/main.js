// Ponto de entrada, inicialização.
/**
 * Main Application Entry Point
 *
 * This file is responsible for initializing the application,
 * loading necessary configurations and saved states, and
 * starting the rendering and event handling processes.
 */

import { initializeEventListeners } from './events.js';
import { renderApp } from '../ui/renderer.js';
import { InputMaskManager } from '../services/formatter.js';
import { calculateFerias, calculateFGTS, calculatePISPASEP, calculateSeguroDesemprego, calculateHorasExtras, calculateINSSCalculator, calculateValeTransporte, calculateIRPF } from '../core/calculations.js';
import { calcularDecimoTerceiro } from '../core/decimoTerceiro.js';
import { openFaqModal } from '../features/knowledge-base/ui.js'; // Example import from a feature
import { updateState, state } from '../core/state.js';
import { getSavedState, getSavePreference } from '../services/storage.js';
import { initParametros, setAnoParametros, getAnoAtual, SUPPORTED_YEARS } from '../core/parametersStore.js';
import { getSelectedParamYear, setSelectedParamYear, getTheme, setTheme } from '../services/storage.js';

/**
 * Asynchronously loads essential configuration files.
 * @throws {Error} If the configuration cannot be loaded.
 */
async function loadConfiguration() {
    try {
        const response = await fetch('./data/legal_texts.json').catch(()=>null);
        if (response && response.ok) {
            try {
                const legalTexts = await response.json();
                updateState('legalTexts', legalTexts);
            } catch(e){ console.warn('[config] Falha parse legal_texts.json', e); }
        } else {
            console.warn('[config] legal_texts.json não encontrado ou inacessível, prosseguindo sem ele');
        }
    } catch (error) {
        console.error('Failed to load application configuration:', error);
        // Display a user-friendly error message on the page
        document.body.innerHTML = '<div style="text-align: center; padding: 50px;"><h1>Erro Crítico</h1><p>Não foi possível carregar as configurações da aplicação. Tente recarregar a página.</p></div>';
        throw error; // Re-throw to stop initialization
    }
}

/**
 * Loads the user's saved state from localStorage if the preference is enabled.
 */
function loadSavedState() {
    if (!getSavePreference()) return;

    const savedState = getSavedState();
    if (savedState && typeof savedState === 'object') {
        // Merge saved state into the current state
        Object.keys(savedState).forEach(calculatorKey => {
            if (state[calculatorKey]) {
                // Only update fields that exist in the initial state to avoid pollution
                Object.keys(savedState[calculatorKey]).forEach(field => {
                    if (field in state[calculatorKey]) {
                        updateState(`${calculatorKey}.${field}`, savedState[calculatorKey][field]);
                    }
                });
            }
        });
    }
}

/**
 * The main initialization function for the application.
 */
async function initializeApp() {
    try {
    // Guard: prevent any legacy fetch attempts for parametros-*.json
    const originalFetch = window.fetch;
    window.fetch = async function(resource, init){
        try {
            if (typeof resource === 'string' && /parametros-20\d{2}\.json/.test(resource)) {
                console.warn('[guard] Blocked legacy fetch to', resource);
                return Promise.resolve(new Response('{}', {status: 410, headers: {'Content-Type': 'application/json'}}));
            }
        } catch(_e){}
        return originalFetch.apply(this, arguments);
    };
    console.info('[init] Year whitelist:', SUPPORTED_YEARS.join(', '));
    // 0. Carrega parâmetros do ano salvo (fallback 2025) antes de qualquer cálculo.
    const anoInicial = getSelectedParamYear(2025);
    if (!SUPPORTED_YEARS.includes(Number(anoInicial))){
        console.warn('[init] Stored year not supported, fallback to latest');
    }
    state.ui.loading = true;
    let paramsLoaded = false;
    try {
        await setAnoParametros(anoInicial);
        await initParametros(anoInicial);
        paramsLoaded = true;
    } catch(err){
        console.error('[init] Falha ao carregar parâmetros iniciais', err);
    } finally {
        state.ui.loading = false;
    }
    // Tema salvo
    const themeSaved = getTheme('system');
    state.ui.theme = themeSaved;
    applyTheme(themeSaved);

        // 1. Load critical configuration first.
        await loadConfiguration();

        // 2. Load saved data from storage.
        loadSavedState();

        // 3. Initialize all event listeners.
        initializeEventListeners();

    // 4. Pré-calcula férias e décimo terceiro iniciais (parâmetros já carregados)
    if (paramsLoaded){
        state.results.ferias = calculateFerias(state.ferias);
        state.results.decimoTerceiro = calcularDecimoTerceiro(state.decimoTerceiro);
        // Pré-cálculos leves (pouco custo) somente se existir salário preenchido
        if (state.fgts.salarioBruto) state.results.fgts = calculateFGTS(state.fgts);
        if (state.pisPasep.salarioMensalMedio || state.pisPasep.salarioBruto) state.results.pisPasep = calculatePISPASEP(state.pisPasep, state.legalTexts);
        if (state.seguroDesemprego.mediaSalariosUltimos3) state.results.seguroDesemprego = calculateSeguroDesemprego(state.seguroDesemprego);
        if (state.horasExtras.salarioBruto) state.results.horasExtras = calculateHorasExtras(state.horasExtras);
        if (state.inss.salarioBruto) state.results.inss = calculateINSSCalculator(state.inss);
        if (state.valeTransporte.salarioBruto || state.valeTransporte.custoDiarioTransporte) state.results.valeTransporte = calculateValeTransporte(state.valeTransporte);
        if (state.irpf.salarioBruto) state.results.irpf = calculateIRPF(state.irpf);
    }
    try {
        const { calcularRescisao } = await import('../core/rescisao.js');
        if (paramsLoaded) state.results.rescisao = calcularRescisao(state.rescisao);
    } catch(_e) { /* opcional */ }
    renderApp();

    if (!paramsLoaded){
        injectParamsErrorBanner(anoInicial);
    }

    // 5. Aplica máscaras monetárias
    try {
        if (InputMaskManager && typeof InputMaskManager.applyCurrencyMask === 'function') {
            document.querySelectorAll('input.money-mask').forEach(el=>InputMaskManager.applyCurrencyMask(el));
        }
    } catch(maskErr){
        console.error('[init] Falha ao aplicar máscaras de moeda', maskErr);
    }
    console.log('Application Initialized Successfully. State:', state);

    // 6. Liga seletor de ano de parâmetros
    const selectAno = document.getElementById('select-ano-param');
    if (selectAno) {
        // Sincroniza valor com ano atual carregado
        const anoCarregado = getAnoAtual();
        if (String(selectAno.value) !== String(anoCarregado)) {
            if ([...selectAno.options].some(o => o.value === String(anoCarregado))) {
                selectAno.value = String(anoCarregado);
            }
        }
    }

    // 7. Seletor de tema
    const selectTheme = document.getElementById('select-theme');
    if (selectTheme) {
        if (selectTheme.value !== state.ui.theme && [...selectTheme.options].some(o=>o.value===state.ui.theme)) {
            selectTheme.value = state.ui.theme;
        }
        if (!selectTheme.dataset.bound) {
            selectTheme.addEventListener('change', (e)=>{
                const theme = e.target.value;
                state.ui.theme = theme;
                setTheme(theme);
                applyTheme(theme);
            });
            selectTheme.dataset.bound = '1';
        }
    }
    if (selectAno && !selectAno.dataset.bound) {
        selectAno.addEventListener('change', async (e) => {
            const ano = Number(e.target.value);
            if (!SUPPORTED_YEARS.includes(ano)) {
                console.error('[ano] Attempt to select unsupported year', ano);
                return;
            }
            try {
                await setAnoParametros(ano);
                await initParametros(ano);
                setSelectedParamYear(ano);
                // Recalcula principais (se salários preenchidos)
                state.results.ferias = calculateFerias(state.ferias);
                state.results.decimoTerceiro = calcularDecimoTerceiro(state.decimoTerceiro);
                // Rescisão só recalcula se já houver salário base
                if (state.rescisao.salarioBruto > 0 || state.rescisao.dataAdmissao || state.rescisao.dataDemissao) {
                    // Lazy import direto de rescisao.js
                    const mod = await import('../core/rescisao.js');
                    if (mod.calcularRescisao) {
                        state.results.rescisao = mod.calcularRescisao(state.rescisao);
                    }
                }
                renderApp();
                console.log('[parametros] Ano alterado para', ano);
            } catch(err){
                console.error('Falha ao trocar parâmetros ano', ano, err);
            }
        });
        selectAno.dataset.bound = '1';
    }

    } catch (error) {
    console.error('Application failed to initialize (continuation attempt):', error);
    }
}

// Start the application once the DOM is fully loaded.
document.addEventListener('DOMContentLoaded', initializeApp);

function applyTheme(mode){
    const root = document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = mode === 'dark' || (mode === 'system' && prefersDark);
    // debug
    try { console.debug('[theme] applyTheme', {mode, prefersDark, isDark}); } catch(_e){}
    root.classList.toggle('dark', isDark);
}

// Reage à mudança de preferência do SO quando em modo system
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ()=>{
    if (state.ui.theme === 'system') applyTheme('system');
});

function injectParamsErrorBanner(ano){
    if (document.getElementById('params-error-banner')) return;
    const div = document.createElement('div');
    div.id = 'params-error-banner';
    div.className = 'mx-auto my-4 max-w-3xl rounded-md border border-red-300 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 p-4 text-sm flex items-start gap-3';
    div.innerHTML = `
        <span class="material-icons-outlined mt-0.5">error_outline</span>
        <div>
            <strong>Parâmetros do ano ${ano} não disponíveis.</strong><br>
            Este build embute apenas os anos: <code>2024, 2025</code>. Selecione um ano suportado ou atualize o código para incluir novos parâmetros.
            <br><button id="retry-load-params" class="mt-2 inline-flex items-center gap-1 rounded bg-red-600 text-white px-3 py-1 text-xs font-medium hover:bg-red-700">Recarregar parâmetros</button>
        </div>`;
    const container = document.getElementById('calculator-panels-container');
    if (container) container.prepend(div);
    const btn = div.querySelector('#retry-load-params');
    if (btn){
        btn.addEventListener('click', async ()=>{
            btn.disabled = true; btn.textContent = 'Recarregando...';
            try {
                await setAnoParametros(ano); await initParametros(ano);
                div.remove();
                state.results.ferias = calculateFerias(state.ferias);
                state.results.decimoTerceiro = calcularDecimoTerceiro(state.decimoTerceiro);
                try { const mod = await import('../core/rescisao.js'); if (mod.calcularRescisao) state.results.rescisao = mod.calcularRescisao(state.rescisao);} catch(_e){}
                renderApp();
            } catch(err){
                console.error('[retry] parâmetros ainda falhando', err);
                btn.disabled = false; btn.textContent = 'Tentar novamente';
            }
        });
    }
}
