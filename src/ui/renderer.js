// Módulo central responsável por renderizar o estado no DOM.
/**
 * UI Renderer
 *
 * Responsável por transformar o estado da aplicação em DOM visível.
 * Não conhece regras de negócio – apenas lê `state` e invoca componentes.
 */

import { state } from '../core/state.js';
import { renderSidebar } from './components/sidebar.js';
import { renderFeriasResults, renderDecimoTerceiroResults, renderRescisaoResults, renderFGTSResults, renderPISPASEPResults, renderSeguroDesempregoResults, renderHorasExtrasResults, renderINSSCalculatorResults, renderValeTransporteResults, renderIRPFResults } from './components/resultCard.js';
import { calculateFerias, calculateFGTS, calculatePISPASEP, calculateSeguroDesemprego, calculateHorasExtras, calculateINSSCalculator, calculateValeTransporte, calculateIRPF } from '../core/calculations.js';
import { calcularDecimoTerceiro } from '../core/decimoTerceiro.js';
import { calcularRescisao } from '../core/rescisao.js';

/**
 * Atualiza o título principal conforme a calculadora ativa.
 */
function renderHeader() {
	const mapTitles = {
		ferias: 'Cálculo de Férias',
		rescisao: 'Cálculo de Rescisão',
		decimoTerceiro: '13º Salário',
		salarioLiquido: 'Salário Líquido',
		fgts: 'FGTS Anual',
		pisPasep: 'PIS/PASEP',
		seguroDesemprego: 'Seguro-Desemprego',
		horasExtras: 'Horas Extras',
		inss: 'INSS',
		valeTransporte: 'Vale-Transporte',
		irpf: 'IRPF Anual'
	};
	const header = document.getElementById('main-header-title');
	if (header) header.textContent = mapTitles[state.activeCalculator] || 'Calculadora';
}

/**
 * Alterna visibilidade dos painéis (simplificado enquanto não há SPA router).
 */
function renderActivePanel() {
	const panelsContainer = document.getElementById('calculator-panels-container');
	if (!panelsContainer) return;
	// Esconde todos
	panelsContainer.querySelectorAll('[id^="calculator-"]').forEach(el => {
		el.classList.add('hidden');
	});
	const activeEl = document.getElementById(`calculator-${state.activeCalculator}`);
	if (activeEl) activeEl.classList.remove('hidden');
}

/**
 * Renderiza resultados específicos de Férias (exemplo inicial).
 * Placeholder: até que cálculos existam, mostra mensagem amigável.
 */
const resultRenderers = {
	ferias: { fn: renderFeriasResults, sel: 'ferias-results', calc: ()=> calculateFerias(state.ferias) },
	decimoTerceiro: { fn: renderDecimoTerceiroResults, sel: 'decimoTerceiro-results', calc: ()=> calcularDecimoTerceiro(state.decimoTerceiro) },
	rescisao: { fn: renderRescisaoResults, sel: 'rescisao-results', calc: ()=> calcularRescisao(state.rescisao) },
	fgts: { fn: renderFGTSResults, sel: 'fgts-results', calc: ()=> calculateFGTS(state.fgts) },
	pisPasep: { fn: renderPISPASEPResults, sel: 'pisPasep-results', calc: ()=> calculatePISPASEP(state.pisPasep, state.legalTexts) },
	seguroDesemprego: { fn: renderSeguroDesempregoResults, sel: 'seguroDesemprego-results', calc: ()=> calculateSeguroDesemprego(state.seguroDesemprego) },
	horasExtras: { fn: renderHorasExtrasResults, sel: 'horasExtras-results', calc: ()=> calculateHorasExtras(state.horasExtras) },
	inss: { fn: renderINSSCalculatorResults, sel: 'inss-results', calc: ()=> calculateINSSCalculator(state.inss) },
	valeTransporte: { fn: renderValeTransporteResults, sel: 'valeTransporte-results', calc: ()=> calculateValeTransporte(state.valeTransporte) },
	irpf: { fn: renderIRPFResults, sel: 'irpf-results', calc: ()=> calculateIRPF(state.irpf) }
};

function renderResults() {
	const info = resultRenderers[state.activeCalculator];
	if (!info) return;
	// recalculo lazy se não existir
	if (!state.results[state.activeCalculator]) {
		try { state.results[state.activeCalculator] = info.calc(); } catch(e){ /* noop */ }
	}
	const container = document.getElementById(info.sel);
	if (container) container.innerHTML = info.fn(state.results[state.activeCalculator] || {});
}

/**
 * Função pública principal: re-render de toda a aplicação.
 */
export function renderApp() {
	renderHeader();
	renderSidebar(state);
	renderActivePanel();
	renderResults();
}

// Opcional: primeira chamada se DOM já carregado (caso importado depois).
if (document.readyState === 'complete' || document.readyState === 'interactive') {
	// Pequeno timeout para garantir que index.html montou tudo.
	setTimeout(() => renderApp(), 0);
} else {
	document.addEventListener('DOMContentLoaded', () => renderApp());
}
