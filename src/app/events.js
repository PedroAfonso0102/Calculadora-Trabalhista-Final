/**
 * @file Módulo de Manipulação de Eventos.
 * @module app/events
 * @description Este módulo centraliza a lógica de manipulação de eventos da interface do usuário.
 * Ele utiliza delegação de eventos para registrar ouvintes no contêiner principal da aplicação,
 * orquestrando a resposta a interações do usuário, como preenchimento de formulários,
 * cliques em botões (calcular, limpar, navegação) e outras ações. A principal responsabilidade
 * é traduzir as interações do usuário em atualizações no estado central da aplicação e
 * disparar os recálculos e a re-renderização da UI quando necessário.
 */

import { updateState, state, initialState } from '../core/state.js';
import { calculateFerias, calculateFGTS, calculatePISPASEP, calculateSeguroDesemprego, calculateHorasExtras, calculateINSSCalculator, calculateValeTransporte, calculateIRPF, calculateSalarioLiquido } from '../core/calculations.js';
import { calcularDecimoTerceiro } from '../core/decimoTerceiro.js';
import { calcularRescisao } from '../core/rescisao.js';
import * as ParamStore from '../core/parametersStore.js';
import { saveState, getSavePreference } from '../services/storage.js';
import { CurrencyFormatter, InputMaskManager, debounce } from '../services/formatter.js';
import { ValidationEngine } from '../core/validation.js';
import { appendHistoryEntry } from '../services/report.js';
import { openFaqModal } from '../features/knowledge-base/ui.js';
import { openAboutModal } from '../features/content/about.js';
import { openGlossaryModal } from '../features/content/glossary.js';
import { openArticlesModal } from '../features/content/articles.js';
import { openHowtoModal } from '../features/content/howto.js';
import { gerarPDFResultado } from '../services/pdf.js';

/**
 * Função de debounce para salvar o estado da aplicação, evitando escritas excessivas no `localStorage`.
 * @type {Function}
 */
const debouncedSaveState = debounce(saveState, 500);

/**
 * Manipula todos os eventos de `input` e `change` delegados do contêiner da aplicação.
 * Esta função identifica o campo do formulário que foi alterado, extrai seu valor,
 * atualiza o estado central da aplicação, dispara a validação em tempo real para o campo,
 * e finalmente, recalcula os resultados da calculadora correspondente.
 * @private
 * @param {Event} event - O objeto de evento (`input` ou `change`).
 */
function handleFormInput(event) {
    const element = event.target;
    const path = element.dataset.state; // ex: "ferias.salarioBruto"

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

    updateState(path, value);

    // Feedback de validação em tempo real
    try {
        const [calc, field] = path.split('.');
        const v = state[calc]?.[field];
        const validation = ValidationEngine.validateField(field, v, state[calc]);
        const fieldContainer = element.closest('.space-y-1, .field, .form-field') || element.parentElement;
        if (validation.isValid) {
            element.classList.remove('input-error');
            element.setAttribute('aria-invalid', 'false');
            if (fieldContainer) {
                const err = fieldContainer.querySelector('.field-error');
                if (err) err.remove();
            }
        } else {
            element.classList.add('input-error');
            element.setAttribute('aria-invalid', 'true');
            if (fieldContainer && !fieldContainer.querySelector('.field-error')) {
                const small = document.createElement('div');
                small.className = 'field-error text-xs text-red-600 mt-1';
                small.textContent = validation.message;
                fieldContainer.appendChild(small);
            }
        }
    } catch(_e) { /* Validação é non-blocking */ }

    let shouldRender = false;
    const paramsOk = typeof ParamStore.areParametrosLoaded === 'function' ? ParamStore.areParametrosLoaded() : false;
    if (paramsOk) {
        if (path.startsWith('ferias.')) { state.results.ferias = calculateFerias(state.ferias); shouldRender = true; }
        if (path.startsWith('decimoTerceiro.')) { state.results.decimoTerceiro = calcularDecimoTerceiro(state.decimoTerceiro); shouldRender = true; }
        if (path.startsWith('rescisao.')) { state.results.rescisao = calcularRescisao(state.rescisao); shouldRender = true; }
        if (path.startsWith('salarioLiquido.')) { state.results.salarioLiquido = calculateSalarioLiquido(state.salarioLiquido); shouldRender = true; }
        if (path.startsWith('fgts.')) { state.results.fgts = calculateFGTS(state.fgts); shouldRender = true; }
        if (path.startsWith('pisPasep.')) { state.results.pisPasep = calculatePISPASEP(state.pisPasep, state.legalTexts); shouldRender = true; }
        if (path.startsWith('seguroDesemprego.')) { state.results.seguroDesemprego = calculateSeguroDesemprego(state.seguroDesemprego); shouldRender = true; }
        if (path.startsWith('horasExtras.')) { state.results.horasExtras = calculateHorasExtras(state.horasExtras); shouldRender = true; }
        if (path.startsWith('inss.')) { state.results.inss = calculateINSSCalculator(state.inss); shouldRender = true; }
        if (path.startsWith('valeTransporte.')) { state.results.valeTransporte = calculateValeTransporte(state.valeTransporte); shouldRender = true; }
        if (path.startsWith('irpf.')) { state.results.irpf = calculateIRPF(state.irpf); shouldRender = true; }
    } else {
        if (!window.__param_warned) {
            console.warn('[events] Ignorando recálculo: parâmetros ainda não carregados');
            window.__param_warned = true;
        }
    }
    if (shouldRender) {
        import('../ui/renderer.js').then(m => m.renderApp());
    }

    console.log(`State updated via ${event.type}:`, path, value);

    if (getSavePreference()) {
        const allowedKeys = Object.keys(initialState);
        const toPersist = {};
        allowedKeys.forEach(k => { toPersist[k] = state[k]; });
        debouncedSaveState(toPersist);
    }
}

/**
 * Inicializa todos os ouvintes de eventos globais para a aplicação.
 * Utiliza delegação de eventos no contêiner `#app` para gerenciar de forma eficiente
 * todas as interações do usuário, desde cliques em botões até a entrada de dados em formulários.
 */
export function initializeEventListeners() {
    /**
     * Função de fábrica para configurar um botão de geração de PDF.
     * @private
     * @param {string} btnId - O ID do elemento do botão.
     * @param {string} titulo - O título a ser usado no cabeçalho do PDF.
     * @param {function(): object} getResultados - Uma função que retorna o objeto de resultados do cálculo.
     * @param {function(object): Array<object>} getSections - Uma função que transforma o objeto de resultados em um formato de seções para o PDF.
     */
    function setupPDFButton(btnId, titulo, getResultados, getSections) {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.addEventListener('click', () => {
                const resultados = getResultados();
                const sections = getSections(resultados) || [];
                gerarPDFResultado(titulo, resultados, sections);
            });
        }
    }

    setupPDFButton('btn-print-ferias', 'Férias', () => state.results.ferias, (r) => [
        { title: 'Base', rows: [
            { label: 'Dias de Férias', value: r?.diasFerias },
            { label: 'Salário Base', value: r?.salarioBruto, format: 'currency' },
            { label: 'Médias (HE+AN)', value: (r?.mediaHorasExtras||0)+(r?.mediaAdicionalNoturno||0), format: 'currency' },
            { label: 'Periculosidade', value: r?.periculosidade, format: 'currency' },
            { label: 'Insalubridade', value: r?.insalubridade, format: 'currency' },
            { label: 'Dependentes', value: r?.dependentes }
        ]},
        { title: 'Incidências', rows: [
            { label: 'Base INSS', value: r?.baseINSS, format: 'currency' },
            { label: 'INSS', value: r?.inss, format: 'currency' },
            { label: 'Base IRRF', value: r?.baseIRRF, format: 'currency' },
            { label: 'IRRF', value: r?.irrf, format: 'currency' },
            { label: 'FGTS (8%)', value: r?.fgts?.valor, format: 'currency' }
        ]},
        { title: 'Totais', rows: [
            { label: 'Remuneração Dias', value: r?.remuneracaoDiasFerias, format: 'currency' },
            { label: 'Adicional 1/3', value: r?.adicionalUmTerco, format: 'currency' },
            { label: 'Abono (1/3)', value: r?.segmentoAbono, format: 'currency' },
            { label: '13º Adiantado', value: r?.segmentoDecimoAdiantado, format: 'currency' },
            { label: 'Líquido (Férias)', value: r?.liquidoSegmentoFerias, format: 'currency' },
            { label: 'Líquido + Abono', value: r?.liquidoComAbono, format: 'currency' },
            { label: 'Total Líquido', value: r?.liquidoComTudo, format: 'currency' }
        ]}
    ]);
    setupPDFButton('btn-print-rescisao', 'Rescisão', () => state.results.rescisao, (r) => [
        { title: 'Contrato', rows: [
            { label: 'Motivo', value: r?.motivo },
            { label: 'Anos (aprox.)', value: r?.anosEstimados },
            { label: 'Dias Aviso', value: r?.diasAviso },
            { label: 'Periculosidade', value: r?.periculosidade, format: 'currency' },
            { label: 'Insalubridade', value: r?.insalubridade, format: 'currency' }
        ]},
        { title: 'Verbas', rows: [
            { label: 'Remuneração Base', value: r?.remuneracaoBase, format: 'currency' },
            { label: 'Saldo Salário', value: r?.saldoSalario, format: 'currency' },
            { label: 'Aviso Indenizado', value: r?.avisoIndenizado, format: 'currency' },
            { label: 'Férias Vencidas', value: r?.feriasVencidas, format: 'currency' },
            { label: 'Férias Proporcionais', value: r?.feriasProporcionais, format: 'currency' },
            { label: '13º Proporcional', value: r?.decimoProporcional, format: 'currency' },
            { label: 'Multa FGTS', value: r?.multaFGTS, format: 'currency' }
        ]},
        { title: 'Totais', rows: [
            { label: 'Total Bruto', value: r?.totalBruto, format: 'currency' },
            { label: 'INSS (simpl.)', value: r?.inss, format: 'currency' },
            { label: 'Base IRRF', value: r?.baseIRRF, format: 'currency' },
            { label: 'IRRF (simpl.)', value: r?.irrf, format: 'currency' },
            { label: 'Total Descontos', value: r?.totalDescontos, format: 'currency' },
            { label: 'Total Líquido Est.', value: r?.totalLiquidoEstimado, format: 'currency' },
            { label: 'Total no TRCT (sem multa FGTS)', value: r?.totalLiquidoSemMulta, format: 'currency' },
            { label: 'Montante total (inclui FGTS + multa)', value: r?.montanteTotalComFGTS, format: 'currency' }
        ]}
    ]);
    setupPDFButton('btn-print-decimoTerceiro', '13º Salário', () => state.results.decimoTerceiro, (r) => [
        { title: 'Base', rows: [
            { label: 'Meses Trabalhados', value: r?.mesesTrabalhados },
            { label: 'Salário Base', value: r?.salarioBruto, format: 'currency' },
            { label: 'Médias (HE+AN)', value: (r?.mediaHorasExtras||0)+(r?.mediaAdicionalNoturno||0), format: 'currency' },
            { label: 'Periculosidade', value: r?.periculosidade, format: 'currency' },
            { label: 'Insalubridade', value: r?.insalubridade, format: 'currency' },
            { label: 'Base + Médias', value: r?.baseComMedias, format: 'currency' }
        ]},
        { title: 'Parcelas', rows: [
            { label: 'Proporcional Bruto', value: r?.proporcionalBruto, format: 'currency' },
            { label: '1ª Parcela Teórica (50%)', value: r?.primeiraParcelaTeorica, format: 'currency' },
            { label: 'Adiantamento Recebido', value: r?.adiantamentoRecebido, format: 'currency' },
            { label: '2ª Parcela (estimada)', value: r?.segundaParcela, format: 'currency' }
        ]},
        { title: 'Incidências e Total', rows: [
            { label: 'INSS', value: r?.inss, format: 'currency' },
            { label: 'Base IRRF Ajustada', value: r?.baseIRRF, format: 'currency' },
            { label: 'IRRF', value: r?.irrf, format: 'currency' },
            { label: 'Líquido Total', value: r?.liquidoTotal, format: 'currency' }
        ]}
    ]);
    setupPDFButton('btn-print-salarioLiquido', 'Salário Líquido', () => state.results.salarioLiquido, (r) => [
        { title: 'Base e Adicionais', rows: [
            { label: 'Salário Base', value: r?.salarioBruto, format: 'currency' },
            { label: 'Periculosidade', value: r?.periculosidade, format: 'currency' },
            { label: 'Insalubridade', value: r?.insalubridade, format: 'currency' },
            { label: 'Horas Extras (50%)', value: r?.valorHorasExtras, format: 'currency' },
            { label: 'Adicional Noturno', value: r?.adicionalNoturno, format: 'currency' },
            { label: 'Bruto', value: r?.bruto, format: 'currency' }
        ]},
        { title: 'Descontos', rows: [
            { label: 'INSS', value: r?.inss, format: 'currency' },
            { label: 'Base IRRF', value: r?.baseIRRF, format: 'currency' },
            { label: 'IRRF', value: r?.irrf, format: 'currency' },
            { label: 'VT', value: r?.descontoVt, format: 'currency' },
            { label: 'VR', value: r?.descontoVr, format: 'currency' },
            { label: 'Saúde', value: r?.descontoSaude, format: 'currency' },
            { label: 'Adiantamentos', value: r?.descontoAdiantamentos, format: 'currency' },
            { label: 'Total Descontos', value: r?.totalDescontos, format: 'currency' }
        ]},
        { title: 'Líquido', rows: [
            { label: 'Salário Família', value: r?.salarioFamilia, format: 'currency' },
            { label: 'Líquido', value: r?.liquido, format: 'currency' }
        ]}
    ]);
    setupPDFButton('btn-print-fgts', 'FGTS', () => state.results.fgts, (r) => [
        { title: 'Depósitos', rows: [
            { label: 'Meses', value: r?.meses },
            { label: 'Base Mensal', value: r?.baseMensal, format: 'currency' },
            { label: 'Depósito Mensal (8%)', value: r?.depositoMensal, format: 'currency' },
            { label: 'Total Acumulado', value: r?.totalAcumulado, format: 'currency' }
        ]}
    ]);
    setupPDFButton('btn-print-pisPasep', 'PIS/PASEP', () => state.results.pisPasep, (r) => [
        { title: 'Resumo', rows: [
            { label: 'Salário Mensal Médio', value: r?.salarioMensalMedio, format: 'currency' },
            { label: 'Direito a Abono', value: r?.temDireito ? 'Sim' : 'Não' },
            { label: 'Valor Abono', value: r?.valorAbono, format: 'currency' }
        ]}
    ]);
    setupPDFButton('btn-print-seguroDesemprego', 'Seguro-Desemprego', () => state.results.seguroDesemprego, (r) => [
        { title: 'Resumo', rows: [
            { label: 'Média 3 meses', value: r?.mediaSalarios, format: 'currency' },
            { label: 'Parcela Estimada', value: r?.parcela, format: 'currency' },
            { label: 'Quantidade de Parcelas', value: r?.quantidadeParcelas }
        ]}
    ]);
    setupPDFButton('btn-print-horasExtras', 'Horas Extras', () => state.results.horasExtras, (r) => [
        { title: 'Resumo', rows: [
            { label: 'Horas 50%', value: r?.valor50, format: 'currency' },
            { label: 'Horas 100%', value: r?.valor100, format: 'currency' },
            { label: 'Total', value: r?.total, format: 'currency' }
        ]}
    ]);
    setupPDFButton('btn-print-inss', 'INSS', () => state.results.inss, (r) => [
        { title: 'Resumo', rows: [
            { label: 'Base', value: r?.base, format: 'currency' },
            { label: 'Total INSS', value: r?.total, format: 'currency' },
            { label: 'Alíquota Efetiva', value: r?.aliquotaEfetiva ? `${r.aliquotaEfetiva}%` : undefined }
        ]}
    ]);
    setupPDFButton('btn-print-valeTransporte', 'Vale-Transporte', () => state.results.valeTransporte, (r) => [
        { title: 'Resumo', rows: [
            { label: 'Custo Diário', value: r?.custoDiarioTransporte, format: 'currency' },
            { label: 'Desconto Empregado', value: r?.descontoEmpregado, format: 'currency' },
            { label: 'Subsídeo Empresa', value: r?.subsidioEmpresa, format: 'currency' },
            { label: 'Custo Total', value: r?.custoTotal, format: 'currency' }
        ]}
    ]);
    setupPDFButton('btn-print-irpf', 'IRPF Anual', () => state.results.irpf, (r) => [
        { title: 'Resumo', rows: [
            { label: 'Rendimento Anual', value: r?.rendimentoAnual, format: 'currency' },
            { label: 'Deduções', value: r?.deducoesTotais, format: 'currency' },
            { label: 'Base de Cálculo', value: r?.base, format: 'currency' },
            { label: 'Imposto Anual', value: r?.impostoAnual, format: 'currency' },
            { label: 'Alíquota Efetiva', value: r?.aliquotaEfetiva ? `${r.aliquotaEfetiva.toFixed ? r.aliquotaEfetiva.toFixed(2) : r.aliquotaEfetiva}%` : undefined }
        ]}
    ]);

    const appContainer = document.getElementById('app');
    if (!appContainer) {
        console.error("Ouvintes de eventos não podem ser anexados: #app não encontrado.");
        return;
    }

    appContainer.addEventListener('input', handleFormInput);
    appContainer.addEventListener('change', handleFormInput);

    const maskObserver = new MutationObserver((mutations) => {
        for (const m of mutations) {
            for (const n of m.addedNodes) {
                if (!(n instanceof HTMLElement)) continue;
                n.querySelectorAll?.('input.money-mask').forEach(el => InputMaskManager.applyCurrencyMask(el));
                if (n.matches?.('input.money-mask')) InputMaskManager.applyCurrencyMask(n);
                n.querySelectorAll?.('input.date-mask').forEach(el => InputMaskManager.applyDateMask(el));
                if (n.matches?.('input.date-mask')) InputMaskManager.applyDateMask(n);
            }
        }
    });
    maskObserver.observe(appContainer, { childList: true, subtree: true });

    appContainer.addEventListener('click', async (e) => {
        const btn = e.target.closest('[data-action="calculate-now"]');
        if (!btn) return;
        const targetSel = btn.getAttribute('data-target-results');
        const calcName = btn.getAttribute('data-calc');
        if (!calcName || !targetSel) return;
        const original = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="material-icons-outlined text-base animate-spin">autorenew</span> Calculando...';
        try {
            let shouldRender = false;
            switch (calcName) {
                case 'ferias': state.results.ferias = calculateFerias(state.ferias); shouldRender = true; break;
                case 'rescisao': state.results.rescisao = calcularRescisao(state.rescisao); shouldRender = true; break;
                case 'decimoTerceiro': state.results.decimoTerceiro = calcularDecimoTerceiro(state.decimoTerceiro); shouldRender = true; break;
                case 'salarioLiquido': state.results.salarioLiquido = calculateSalarioLiquido(state.salarioLiquido); shouldRender = true; break;
                case 'fgts': state.results.fgts = calculateFGTS(state.fgts); shouldRender = true; break;
                case 'pisPasep': state.results.pisPasep = calculatePISPASEP(state.pisPasep, state.legalTexts); shouldRender = true; break;
                case 'seguroDesemprego': state.results.seguroDesemprego = calculateSeguroDesemprego(state.seguroDesemprego); shouldRender = true; break;
                case 'horasExtras': state.results.horasExtras = calculateHorasExtras(state.horasExtras); shouldRender = true; break;
                case 'inss': state.results.inss = calculateINSSCalculator(state.inss); shouldRender = true; break;
                case 'valeTransporte': state.results.valeTransporte = calculateValeTransporte(state.valeTransporte); shouldRender = true; break;
                case 'irpf': state.results.irpf = calculateIRPF(state.irpf); shouldRender = true; break;
            }
            if (shouldRender) {
                const { renderApp } = await import('../ui/renderer.js');
                renderApp();
            }
            const results = document.getElementById(targetSel);
            results?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            try { appendHistoryEntry(calcName, state[calcName], state.results[calcName]); } catch(_e){}
        } finally {
            btn.disabled = false;
            btn.innerHTML = original;
        }
    });

    appContainer.addEventListener('click', (e)=>{
        const faq = e.target.closest('[data-action="open-faq"]');
        const about = e.target.closest('[data-action="open-about"]');
        const glossary = e.target.closest('[data-action="open-glossary"]');
        const articles = e.target.closest('[data-action="open-articles"]');
        const howto = e.target.closest('[data-action="open-howto"]');
        if (!(faq || about || glossary || articles || howto)) return;
        e.preventDefault();
        try {
            if (faq) return openFaqModal();
            if (about) return openAboutModal();
            if (glossary) return openGlossaryModal();
            if (articles) return openArticlesModal();
            if (howto) return openHowtoModal();
        } catch(err){ console.error('[content] erro ao abrir modal', err); }
    });

    appContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action="toggle-mobile-sidebar"]');
        if (!btn) return;
        e.preventDefault();
        toggleMobileSidebar(btn);
    });

    appContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action="activate-calculator"]');
        if (!btn) return;
        e.preventDefault();
        const newId = btn.dataset.calculator;
        if (!newId) return;
        if (state.activeCalculator !== newId) {
            state.activeCalculator = newId;
            import('../ui/renderer.js').then(m => m.renderApp());
        }
        closeMobileSidebar();
    });

    if (!document.body.dataset.mobileSidebarEscBound) {
        document.addEventListener('keydown', (ev) => {
            if (ev.key === 'Escape') closeMobileSidebar();
        });
        document.body.dataset.mobileSidebarEscBound = '1';
    }

    appContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action="clear-form"]');
        if (!btn) return;
        e.preventDefault();
        const formId = btn.dataset.form;
        if (!formId) return;

        const form = document.getElementById(formId);
        if (form) {
            form.reset();
            const calcName = formId.replace('form-', '');
            if (state[calcName] && initialState[calcName]) {
                Object.keys(initialState[calcName]).forEach(key => {
                    updateState(`${calcName}.${key}`, initialState[calcName][key]);
                });
                state.results[calcName] = {};
                import('../ui/renderer.js').then(m => m.renderApp());
            }
        }
    });
}

/**
 * Alterna a visibilidade da barra lateral em dispositivos móveis, gerenciando
 * o estado de `data-open` e os atributos ARIA para acessibilidade. Também cria e remove
 * um backdrop para fechar a barra lateral ao clicar fora dela.
 * @private
 * @param {HTMLElement} toggleBtn - O elemento do botão que acionou a ação.
 */
function toggleMobileSidebar(toggleBtn){
    const aside = document.getElementById('main-sidebar');
    if (!aside) return;
    const isOpen = aside.getAttribute('data-open') === '1';
    if (isOpen) return closeMobileSidebar(toggleBtn);

    aside.setAttribute('data-open', '1');
    try {
        if (toggleBtn){
            toggleBtn.setAttribute('aria-expanded', 'true');
            toggleBtn.setAttribute('aria-controls', 'main-sidebar');
        }
    } catch(_e){}

    let backdrop = document.getElementById('mobile-sidebar-backdrop');
    if (!backdrop){
        backdrop = document.createElement('div');
        backdrop.id = 'mobile-sidebar-backdrop';
        document.body.appendChild(backdrop);
        backdrop.addEventListener('click', () => closeMobileSidebar(toggleBtn));
    }
}

/**
 * Fecha a barra lateral móvel, remove o backdrop e atualiza os atributos ARIA.
 * @private
 * @param {HTMLElement} [toggleBtn] - O elemento do botão de toggle, para atualizar seu estado ARIA, se fornecido.
 */
function closeMobileSidebar(toggleBtn){
    const aside = document.getElementById('main-sidebar');
    if (aside) aside.setAttribute('data-open', '0');
    const backdrop = document.getElementById('mobile-sidebar-backdrop');
    if (backdrop) backdrop.remove();
    try { if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false'); } catch(_e){}
}

/**
 * Alias de `initializeEventListeners` em português para consistência de nomenclatura no projeto.
 * @type {typeof initializeEventListeners}
 */
export const inicializarListenersEventos = initializeEventListeners;
