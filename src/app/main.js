/**
 * @file Ponto de Entrada Principal da Aplicação.
 * @module app/main
 * @description Orquestra a inicialização completa da aplicação. Este módulo é responsável por:
 * 1. Carregar configurações essenciais (ex: textos legais).
 * 2. Carregar o estado salvo do usuário do `localStorage`.
 * 3. Inicializar os parâmetros de cálculo (tabelas de impostos, etc.) para o ano correto.
 * 4. Aplicar o tema visual (claro/escuro) salvo pelo usuário.
 * 5. Registrar todos os manipuladores de eventos globais e de formulário.
 * 6. Sincronizar campos comuns entre diferentes calculadoras.
 * 7. Renderizar o estado inicial da aplicação na UI.
 */

import { initializeEventListeners } from './events.js';
import { renderApp } from '../ui/renderer.js';
import { InputMaskManager, CurrencyFormatter } from '../services/formatter.js';
import { calculateFerias, calculateFGTS, calculatePISPASEP, calculateSeguroDesemprego, calculateHorasExtras, calculateINSSCalculator, calculateValeTransporte, calculateIRPF, calculateSalarioLiquido } from '../core/calculations.js';
import { calcularDecimoTerceiro } from '../core/decimoTerceiro.js';
import { openFaqModal } from '../features/knowledge-base/ui.js';
import { updateState, state } from '../core/state.js';
import { getSavedState, getSavePreference } from '../services/storage.js';
import { initParametros, setAnoParametros, SUPPORTED_YEARS } from '../core/parametersStore.js';
import { getSelectedParamYear, getTheme } from '../services/storage.js';
import { getUseGlobalSalary } from '../services/storage.js';
import { initTooltips } from '../ui/components/tooltip.js';
import { openHistoryModal, openSettingsModal } from '../ui/components/modal.js';

/**
 * Carrega configurações essenciais, como textos legais, de forma assíncrona a partir de um arquivo JSON.
 * Se o arquivo não for encontrado ou houver um erro de parsing, a aplicação continua a execução com um aviso no console.
 * @async
 * @private
 * @returns {Promise<void>} Uma promessa que resolve quando a configuração é carregada ou a tentativa falha.
 * @throws {Error} Se ocorrer um erro de rede fatal que impeça a continuação, a exceção é relançada para interromper a inicialização.
 */
async function loadConfiguration() {
    try {
        const response = await fetch('./data/legal_texts.json').catch(()=>null);
        if (response?.ok) {
            try {
                const legalTexts = await response.json();
                updateState('legalTexts', legalTexts);
            } catch(e){ console.warn('[config] Falha parse legal_texts.json', e); }
        } else {
            console.warn('[config] legal_texts.json não encontrado ou inacessível, prosseguindo sem ele');
        }
    } catch (error) {
        console.error('Falha ao carregar configuração da aplicação:', error);
        document.body.innerHTML = '<div style="text-align: center; padding: 50px;"><h1>Erro Crítico</h1><p>Não foi possível carregar as configurações da aplicação. Tente recarregar a página.</p></div>';
        throw error;
    }
}

/**
 * Carrega o estado salvo do usuário a partir do `localStorage`, se a preferência de salvamento estiver ativa.
 * A função mescla o estado salvo com o estado inicial da aplicação, garantindo que apenas
 * campos existentes e válidos sejam restaurados para evitar a poluição do estado.
 * @private
 */
function loadSavedState() {
    if (!getSavePreference()) return;

    const savedState = getSavedState();
    if (savedState && typeof savedState === 'object') {
        Object.keys(savedState).forEach(calculatorKey => {
            if (state[calculatorKey]) {
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
 * Função principal que orquestra a inicialização da aplicação.
 * Executa sequencialmente todos os passos necessários para que a aplicação esteja pronta para uso,
 * desde o carregamento de dados até a renderização da UI e configuração de eventos.
 * @async
 * @private
 */
async function initializeApp() {
    try {
        /**
         * Intercepta a função `fetch` global para prevenir chamadas a arquivos de parâmetros legados.
         * Esta é uma medida de segurança para garantir que apenas o novo sistema de parâmetros (`parametersStore`) seja usado.
         * @private
         */
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

        const anoInicial = getSelectedParamYear(2025);
        if (!SUPPORTED_YEARS.includes(Number(anoInicial))){
            console.warn('[init] Ano armazenado não suportado, usando o mais recente como padrão');
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

        const themeSaved = getTheme('system');
        state.ui.theme = themeSaved;
        applyTheme(themeSaved);

        await loadConfiguration();
        loadSavedState();
        initializeEventListeners();

        if (paramsLoaded){
            if (state.ferias.salarioBruto) state.results.ferias = calculateFerias(state.ferias);
            if (state.decimoTerceiro.salarioBruto) state.results.decimoTerceiro = calcularDecimoTerceiro(state.decimoTerceiro);
            if (state.salarioLiquido.salarioBruto) state.results.salarioLiquido = calculateSalarioLiquido(state.salarioLiquido);
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
        } catch(_e) { /* Rescisão é opcional e pode ser lazy-loaded */ }

        renderApp();
        initTooltips();

        if (!paramsLoaded){
            injectParamsErrorBanner(anoInicial);
        }

        try {
            if (InputMaskManager && typeof InputMaskManager.applyCurrencyMask === 'function') {
                document.querySelectorAll('input.money-mask').forEach(el=>InputMaskManager.applyCurrencyMask(el));
            }
            if (InputMaskManager && typeof InputMaskManager.applyDateMask === 'function') {
                document.querySelectorAll('input.date-mask').forEach(el=>InputMaskManager.applyDateMask(el));
            }
            if (InputMaskManager && typeof InputMaskManager.applyMonthYearMask === 'function') {
                document.querySelectorAll('input.month-year-mask').forEach(el=>InputMaskManager.applyMonthYearMask(el));
            }
        } catch(maskErr){
            console.error('[init] Falha ao aplicar máscaras de formatação', maskErr);
        }

        try {
            state.ui.useGlobalSalary = getUseGlobalSalary(true);

            bindGlobalFieldSync({
                fieldName: 'salarioBruto',
                targetCalculators: ['ferias', 'rescisao', 'decimoTerceiro', 'salarioLiquido', 'fgts', 'horasExtras', 'inss', 'valeTransporte', 'irpf'],
                isCurrency: true
            });

            bindGlobalFieldSync({
                fieldName: 'dependentes',
                targetCalculators: ['ferias', 'rescisao', 'salarioLiquido', 'irpf', 'decimoTerceiro'],
                isCurrency: false
            });

            bindGlobalFieldSync({
                fieldName: 'saldoFgts',
                targetCalculators: ['rescisao', 'fgts'],
                isCurrency: true
            });

            bindGlobalFieldSync({
                fieldName: 'adicionalPericulosidade',
                targetCalculators: ['ferias', 'rescisao', 'decimoTerceiro', 'salarioLiquido'],
                isCurrency: false
            });
            bindGlobalFieldSync({
                fieldName: 'adicionalInsalubridadeGrau',
                targetCalculators: ['ferias', 'rescisao', 'decimoTerceiro', 'salarioLiquido'],
                isCurrency: false
            });
            bindGlobalFieldSync({
                fieldName: 'insalubridadeBase',
                targetCalculators: ['ferias', 'rescisao', 'decimoTerceiro', 'salarioLiquido'],
                isCurrency: false
            });

            bindGlobalFieldSync({
                fieldName: 'mediaHorasExtras',
                targetCalculators: ['ferias', 'rescisao', 'decimoTerceiro'],
                isCurrency: true
            });
            bindGlobalFieldSync({
                fieldName: 'mediaAdicionalNoturno',
                targetCalculators: ['ferias', 'rescisao', 'decimoTerceiro'],
                isCurrency: true
            });

            const descontos = ['descontoVt', 'descontoVr', 'descontoSaude', 'descontoAdiantamentos'];
            descontos.forEach(desconto => {
                bindGlobalFieldSync({
                    fieldName: desconto,
                    targetCalculators: ['rescisao', 'salarioLiquido'],
                    isCurrency: true
                });
            });

        } catch (syncErr) {
            console.error('[init] Falha ao vincular sincronização de campos globais', syncErr);
        }
        console.log('Aplicação inicializada com sucesso. Estado:', state);

        const btnHistory = document.getElementById('btn-open-history');
        if (btnHistory && !btnHistory.dataset.bound) {
            btnHistory.addEventListener('click', () => openHistoryModal());
            btnHistory.dataset.bound = '1';
        }

        const btnSettings = document.getElementById('btn-open-settings');
        if (btnSettings && !btnSettings.dataset.bound) {
            btnSettings.addEventListener('click', () => openSettingsModal());
            btnSettings.dataset.bound = '1';
        }

    } catch (error) {
        console.error('Falha crítica ao inicializar aplicação:', error);
    }
}

/**
 * Ponto de entrada da aplicação. Adiciona um listener que chama `initializeApp`
 * assim que o conteúdo do DOM estiver completamente carregado.
 */
document.addEventListener('DOMContentLoaded', initializeApp);

/**
 * Sincroniza um campo de formulário entre várias calculadoras para fornecer uma experiência de usuário coesa.
 * Quando um campo compartilhado (como 'salarioBruto') é alterado em uma calculadora, o valor é
 * propagado para os campos correspondentes nas outras calculadoras definidas.
 * @private
 * @param {object} config - A configuração para a sincronização.
 * @param {string} config.fieldName - O nome do campo a ser sincronizado (ex: 'salarioBruto').
 * @param {string[]} config.targetCalculators - Uma lista de nomes de calculadoras que compartilham este campo.
 * @param {boolean} config.isCurrency - Indica se o campo é um valor monetário, para aplicar a formatação e máscara corretas.
 */
function bindGlobalFieldSync({ fieldName, targetCalculators, isCurrency }) {
    const inputs = Array.from(document.querySelectorAll(`input[data-state$=".${fieldName}"]`));
    const guardAttr = `data-syncing-${fieldName}`;

    inputs.forEach(input => {
        if (input.dataset.bound) return;
        input.dataset.bound = '1';

        input.addEventListener('input', () => {
            if (!getUseGlobalSalary(state.ui.useGlobalSalary)) return;
            if (input.hasAttribute(guardAttr)) return;

            const rawValue = input.value || '';
            let parsedValue;

            if (isCurrency) {
                parsedValue = CurrencyFormatter.unmask(rawValue);
            } else if (input.type === 'number') {
                parsedValue = parseFloat(rawValue);
                if (isNaN(parsedValue)) parsedValue = 0;
            } else {
                parsedValue = rawValue;
            }

            targetCalculators.forEach(calc => {
                try {
                    updateState(`${calc}.${fieldName}`, parsedValue);
                } catch (e) {
                    // Ignora silenciosamente se uma calculadora não tiver o campo.
                }
            });

            inputs.forEach(otherInput => {
                if (otherInput === input) return;

                try {
                    otherInput.setAttribute(guardAttr, '1');
                    let displayValue = parsedValue;
                    if (isCurrency) {
                        displayValue = CurrencyFormatter.format(parsedValue);
                    }
                    otherInput.value = displayValue;

                    if (isCurrency && typeof InputMaskManager.applyCurrencyMask === 'function') {
                         InputMaskManager.applyCurrencyMask(otherInput);
                    }
                } finally {
                    otherInput.removeAttribute(guardAttr);
                }
            });
        });
    });
}

/**
 * Aplica o tema visual (claro ou escuro) à aplicação, adicionando ou removendo a classe 'dark' do elemento raiz (`<html>`).
 * A decisão é baseada no modo selecionado pelo usuário ('light', 'dark') ou na preferência do sistema operacional ('system').
 * @private
 * @param {string} mode - O modo de tema a ser aplicado ('light', 'dark', ou 'system').
 */
function applyTheme(mode){
    const root = document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = mode === 'dark' || (mode === 'system' && prefersDark);
    try { console.debug('[theme] applyTheme', {mode, prefersDark, isDark}); } catch(_e){}
    root.classList.toggle('dark', isDark);
}

/**
 * Adiciona um listener para reagir a mudanças no tema do sistema operacional.
 * Se o tema do sistema mudar (ex: de claro para escuro) e o usuário tiver
 * selecionado o modo 'system', a aplicação atualiza seu tema para corresponder.
 */
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ()=>{
    if (state.ui.theme === 'system') applyTheme('system');
});

/**
 * Injeta um banner de erro na interface do usuário caso os parâmetros de cálculo para um ano específico não possam ser carregados.
 * O banner informa o usuário sobre o problema e oferece uma opção para tentar recarregar os parâmetros.
 * @private
 * @param {number|string} ano - O ano que falhou ao carregar, para ser exibido na mensagem de erro.
 */
function injectParamsErrorBanner(ano){
    if (document.getElementById('params-error-banner')) return;
    const div = document.createElement('div');
    div.id = 'params-error-banner';
    div.className = 'mx-auto my-4 max-w-3xl rounded-md border border-red-300 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 p-4 text-sm flex items-start gap-3';
    div.innerHTML = `
        <span class="material-icons-outlined mt-0.5">error_outline</span>
        <div>
            <strong>Parâmetros do ano ${ano} não disponíveis.</strong><br>
            Este build embute os anos: <code>2020, 2021, 2022, 2023, 2024, 2025</code>. Selecione um ano suportado ou atualize o código para incluir novos parâmetros.
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
