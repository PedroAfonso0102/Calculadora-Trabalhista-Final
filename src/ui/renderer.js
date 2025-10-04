/**
 * @file Módulo de Renderização da Interface do Usuário (UI).
 * @module ui/renderer
 * @description Este módulo é o coração da renderização da UI. Ele é responsável por
 * ler o estado central da aplicação (`state`) e traduzi-lo em atualizações no DOM.
 * Ele orquestra a chamada de componentes de UI específicos (como a barra lateral,
 * o painel de conteúdo ativo e os cartões de resultado), garantindo que a UI
 * reflita de forma consistente o estado atual. Este módulo não contém lógica de
 * negócio, apenas lógica de apresentação.
 */

import { state } from '../core/state.js';
import { renderSidebar } from './components/sidebar.js';
import { renderHomePage } from './components/homePage.js';
import { renderFeriasResults, renderDecimoTerceiroResults, renderRescisaoResults, renderFGTSResults, renderPISPASEPResults, renderSeguroDesempregoResults, renderHorasExtrasResults, renderINSSCalculatorResults, renderValeTransporteResults, renderIRPFResults, renderSalarioLiquidoResults } from './components/resultCard.js';
import { calculateFerias, calculateFGTS, calculatePISPASEP, calculateSeguroDesemprego, calculateHorasExtras, calculateINSSCalculator, calculateValeTransporte, calculateIRPF, calculateSalarioLiquido } from '../core/calculations.js';
import { calcularDecimoTerceiro } from '../core/decimoTerceiro.js';
import { calcularRescisao } from '../core/rescisao.js';

/**
 * Atualiza o título principal da página (`<h1>`) para refletir a calculadora
 * que está atualmente ativa, com base em `state.activeCalculator`.
 * @private
 */
function renderHeader() {
	const mapTitles = {
		home: 'Página Inicial',
		ferias: 'Cálculo de Férias',
		rescisao: 'Cálculo de Rescisão',
		decimoTerceiro: '13º Salário',
		salarioLiquido: 'Salário Líquido',
		fgts: 'Calculadora de FGTS',
		pisPasep: 'PIS/PASEP',
		seguroDesemprego: 'Seguro-Desemprego',
		horasExtras: 'Horas Extras',
		inss: 'INSS',
		valeTransporte: 'Vale-Transporte',
		irpf: 'IRPF Anual'
	};
	const header = document.getElementById('main-header-title');
	if (header) header.textContent = mapTitles[state.activeCalculator] || 'Calculadora';
	// Adiciona uma classe CSS especial ao cabeçalho quando na página inicial para estilização.
	try {
		const hdrRoot = header.closest('header');
		if (hdrRoot) hdrRoot.classList.toggle('header-home', state.activeCalculator === 'home');
	} catch(_e){}
}

/**
 * Gerencia a visibilidade dos painéis de conteúdo da calculadora.
 * Ele esconde todos os painéis e, em seguida, exibe apenas aquele que corresponde
 * à calculadora ativa em `state.activeCalculator`.
 * @private
 */
function renderActivePanel() {
	const panelsContainer = document.getElementById('calculator-panels-container');
	if (!panelsContainer) return;
	// Esconde todos os painéis de calculadora.
	panelsContainer.querySelectorAll('[id^="calculator-"]').forEach(el => {
		el.classList.add('hidden');
	});
	if (state.activeCalculator === 'home') {
		const home = document.getElementById('calculator-home');
		if (home) {
			home.classList.remove('hidden');
			renderHomePage();
		}
		return;
	}
	const activeEl = document.getElementById(`calculator-${state.activeCalculator}`);
	if (activeEl) activeEl.classList.remove('hidden');
}

/**
 * Mapa de configuração que associa cada calculadora à sua função de renderização de resultados,
 * ao seletor do contêiner de resultados no DOM e à sua função de cálculo principal.
 * @private
 * @type {Object.<string, {fn: Function, sel: string, calc: Function}>}
 */
const resultRenderers = {
	ferias: { fn: renderFeriasResults, sel: 'ferias-results', calc: ()=> calculateFerias(state.ferias) },
	decimoTerceiro: { fn: renderDecimoTerceiroResults, sel: 'decimoTerceiro-results', calc: ()=> calcularDecimoTerceiro(state.decimoTerceiro) },
	rescisao: { fn: renderRescisaoResults, sel: 'rescisao-results', calc: ()=> calcularRescisao(state.rescisao) },
	salarioLiquido: { fn: renderSalarioLiquidoResults, sel: 'salarioLiquido-results', calc: ()=> calculateSalarioLiquido(state.salarioLiquido) },
	fgts: { fn: renderFGTSResults, sel: 'fgts-results', calc: ()=> calculateFGTS(state.fgts) },
	pisPasep: { fn: renderPISPASEPResults, sel: 'pisPasep-results', calc: ()=> calculatePISPASEP(state.pisPasep, state.legalTexts) },
	seguroDesemprego: { fn: renderSeguroDesempregoResults, sel: 'seguroDesemprego-results', calc: ()=> calculateSeguroDesemprego(state.seguroDesemprego) },
	horasExtras: { fn: renderHorasExtrasResults, sel: 'horasExtras-results', calc: ()=> calculateHorasExtras(state.horasExtras) },
	inss: { fn: renderINSSCalculatorResults, sel: 'inss-results', calc: ()=> calculateINSSCalculator(state.inss) },
	valeTransporte: { fn: renderValeTransporteResults, sel: 'valeTransporte-results', calc: ()=> calculateValeTransporte(state.valeTransporte) },
	irpf: { fn: renderIRPFResults, sel: 'irpf-results', calc: ()=> calculateIRPF(state.irpf) }
};

/**
 * Renderiza o cartão de resultados para a calculadora atualmente ativa.
 * Se os resultados ainda não foram calculados, ele invoca a função de cálculo
 * correspondente de forma "preguiçosa" (lazy) antes de renderizar.
 * @private
 */
function renderResults() {
	if (state.activeCalculator === 'home') return; // A página inicial não tem cartão de resultados.
	const info = resultRenderers[state.activeCalculator];
	if (!info) return;
	// Recalcula de forma preguiçosa se os resultados não existirem no estado.
	if (!state.results[state.activeCalculator]) {
		try { state.results[state.activeCalculator] = info.calc(); } catch(e){ /* Ignora erros de cálculo silenciosamente na renderização inicial */ }
	}
	const container = document.getElementById(info.sel);
	if (container) container.innerHTML = info.fn(state.results[state.activeCalculator] || {});
}

/**
 * Função principal que orquestra a renderização de toda a aplicação.
 * Ela é chamada sempre que o estado muda e a UI precisa ser atualizada para
 * refletir essas mudanças.
 * @public
 */
export function renderApp() {
	renderHeader();
	renderSidebar(state);
	renderActivePanel();
	renderResults();
}

// Garante que a primeira renderização ocorra assim que o DOM estiver pronto.
if (document.readyState === 'complete' || document.readyState === 'interactive') {
	// Usa um pequeno timeout para garantir que o script de inicialização principal (main.js)
	// tenha tido a chance de configurar completamente o estado inicial.
	setTimeout(() => renderApp(), 0);
} else {
	document.addEventListener('DOMContentLoaded', () => renderApp());
}

/**
 * Alias de `renderApp` em português para consistência de nomenclatura no projeto.
 * @type {typeof renderApp}
 */
export const renderizarAplicacao = renderApp;
