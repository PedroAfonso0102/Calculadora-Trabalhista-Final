// Componente de UI: sidebar
/**
 * Sidebar UI Component
 *
 * Responsável por montar a navegação lateral com base em `state.visibleCalculators`.
 */

const LABELS = {
	ferias: 'Férias',
	rescisao: 'Rescisão',
	decimoTerceiro: '13º Salário',
	salarioLiquido: 'Salário Líquido',
	fgts: 'FGTS',
	pisPasep: 'PIS/PASEP',
	seguroDesemprego: 'Seguro-Desemp.',
	horasExtras: 'Horas Extras',
	inss: 'INSS',
	valeTransporte: 'Vale-Transp.',
	irpf: 'IRPF'
};

const ICONS = {
	ferias: 'beach_access',
	rescisao: 'work_off',
	decimoTerceiro: 'card_giftcard',
	salarioLiquido: 'payments',
	fgts: 'account_balance',
	pisPasep: 'verified_user',
	seguroDesemprego: 'security',
	horasExtras: 'schedule',
	inss: 'local_hospital',
	valeTransporte: 'commute',
	irpf: 'receipt_long'
};

/**
 * Gera HTML de um item da sidebar.
 */
function sidebarItem(id, active) {
	const base = 'w-full justify-start text-left flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors';
	const activeCls = active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-primary hover:bg-primary/10';
	return `<button data-action="activate-calculator" data-calculator="${id}" class="${base} ${activeCls}">
		<span class="material-icons-outlined text-base">${ICONS[id]||'calculate'}</span>
		<span>${LABELS[id] || id}</span>
	</button>`;
}

/**
 * Renderiza a sidebar dentro de #sidebar-nav-list.
 */
export function renderSidebar(state) {
	const list = document.getElementById('sidebar-nav-list');
	if (!list) return;
	list.innerHTML = state.visibleCalculators
		.filter(id => LABELS[id])
		.map(id => sidebarItem(id, state.activeCalculator === id))
		.join('');

	// Delegação de click (apenas uma vez)
	if (!list.dataset.bound) {
		list.addEventListener('click', e => {
			const btn = e.target.closest('[data-action="activate-calculator"]');
			if (!btn) return;
			const newId = btn.dataset.calculator;
			if (newId && newId !== state.activeCalculator) {
				state.activeCalculator = newId; // simples, poderia usar updateState
				import('../renderer.js').then(m => m.renderApp());
			}
		});
		list.dataset.bound = '1';
	}
}
