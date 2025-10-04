/**
 * @file Componente de UI da Barra Lateral (Sidebar).
 * @module ui/components/sidebar
 * @description Este módulo é responsável por renderizar a barra de navegação lateral.
 * Ele cria dinamicamente os links para as calculadoras e as seções de conteúdo,
 * gerencia o estado de colapso das seções (aberto/fechado) e persiste esse estado
 * no `localStorage` para uma experiência de usuário consistente entre as sessões.
 */

import { getSidebarState, setSidebarState } from '../../services/storage.js';
import { CALCULATORS } from '../../data/calculators.js';

/**
 * Mapeamento de IDs de calculadoras para seus rótulos de exibição.
 * @private
 * @type {Object.<string, string>}
 */
const LABELS = {
	home: 'Página Inicial',
	...Object.fromEntries(Object.entries(CALCULATORS).map(([k, v]) => [k, v.label]))
};

/**
 * Mapeamento de IDs de calculadoras para os nomes de seus ícones (Material Icons).
 * @private
 * @type {Object.<string, string>}
 */
const ICONS = {
	home: 'home',
	...Object.fromEntries(Object.entries(CALCULATORS).map(([k, v]) => [k, v.icon]))
};

/**
 * Gera a string HTML para um botão de link de navegação na barra lateral.
 * @private
 * @param {string} id - O ID da calculadora ou página (ex: 'ferias', 'home').
 * @param {boolean} active - Indica se o link deve ser estilizado como ativo.
 * @returns {string} A string HTML do elemento do botão.
 */
function linkButton(id, active){
	const base = 'w-full justify-start text-left flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors';
	const activeCls = active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-primary hover:bg-primary/10';
	const semibold = id === 'home' ? ' font-medium' : '';
	return `<button data-action="activate-calculator" data-calculator="${id}" class="${base}${semibold} ${activeCls}">
		<span class="material-icons-outlined text-base">${ICONS[id]||'calculate'}</span>
		<span>${LABELS[id] || id}</span>
	</button>`;
}

/**
 * Gera a string HTML para o cabeçalho de uma seção colapsável (`<details>`).
 * @private
 * @param {string} title - O título da seção.
 * @param {string} icon - O nome do ícone do Material Icons a ser exibido ao lado do título.
 * @returns {string} A string HTML do elemento `<summary>`.
 */
function sectionSummary(title, icon){
	return `<summary class="flex items-center justify-between cursor-pointer list-none select-none rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-primary/10">
		<span class="flex items-center gap-3">
			<span class="material-icons-outlined text-base">${icon}</span>
			<span class="font-semibold">${title}</span>
		</span>
		<span class="material-icons-outlined text-base chevron">expand_more</span>
	</summary>`;
}

/**
 * Renderiza o conteúdo completo da barra lateral de navegação dentro do elemento `#sidebar-nav-list`.
 * A função lê o estado da aplicação para determinar qual link está ativo e quais calculadoras
 * devem ser visíveis. Ela também recupera e aplica o estado de colapso salvo para as seções.
 * @param {object} state - O objeto de estado global da aplicação.
 */
export function renderSidebar(state) {
	const list = document.getElementById('sidebar-nav-list');
	if (!list) return;
	const calculators = state.visibleCalculators.filter(id => LABELS[id]);

	// Recupera o estado salvo (aberto/fechado) das seções da sidebar.
	let sidebarState = getSidebarState({ calculators: true, content: false }) || { calculators: true, content: false };

	const parts = [];
	parts.push(linkButton('home', state.activeCalculator === 'home'));

	// Seção de Calculadoras
	parts.push(`
		<details data-section="calculators" ${sidebarState.calculators ? 'open' : ''}>
			${sectionSummary('Calculadoras', 'apps')}
			<div class="mt-1 ml-1 space-y-1">
				${calculators.map(id => linkButton(id, state.activeCalculator === id)).join('')}
			</div>
		</details>
	`);

	// Seção de Conteúdo e Informações
	const contentLinks = [
		{ id: 'open-faq', label: 'Base de Conhecimento', icon: 'quiz', action: 'open-faq' },
		{ id: 'articles', label: 'Artigos Publicados', icon: 'newspaper', action: 'open-articles' },
		{ id: 'about', label: 'Sobre a Ferramenta', icon: 'info', action: 'open-about' },
		{ id: 'glossario', label: 'Glossário de Termos', icon: 'library_books', action: 'open-glossary' }
	];
	parts.push(`
		<details data-section="content" ${sidebarState.content ? 'open' : ''}>
			${sectionSummary('Conteúdo & Informações', 'menu_book')}
			<div class="mt-1 ml-1 space-y-1">
				${contentLinks.map(l => `
					<button data-action="${l.action}" class="w-full justify-start text-left flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-primary/10">
						<span class="material-icons-outlined text-base">${l.icon}</span>
						<span>${l.label}</span>
					</button>
				`).join('')}
			</div>
		</details>
	`);

	list.innerHTML = parts.join('');

	// Anexa os ouvintes de evento de forma idempotente (apenas uma vez).
	if (!list.dataset.bound) {
		// Delegação de clique para ativar calculadoras.
		list.addEventListener('click', e => {
			const btn = e.target.closest('[data-action="activate-calculator"]');
			if (btn) {
				const newId = btn.dataset.calculator;
				if (newId && newId !== state.activeCalculator) {
					state.activeCalculator = newId;
					import('../renderer.js').then(m => m.renderApp());
				}
				return;
			}
		});
		// Persiste o estado de colapso das seções ao abrir/fechar.
		list.addEventListener('toggle', (e) => {
			const details = e.target.closest('details[data-section]');
			if (!details || e.target !== details) return;
			const key = details.getAttribute('data-section');
			const open = details.open;
			if (key === 'calculators') setSidebarState({ calculators: open });
			if (key === 'content') setSidebarState({ content: open });
		}, { capture: true });
		list.dataset.bound = '1';
	}
}

/**
 * Alias de `renderSidebar` em português para consistência de nomenclatura no projeto.
 * @type {typeof renderSidebar}
 */
export const renderizarSidebar = renderSidebar;
