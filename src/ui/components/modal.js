/**
 * @file Componente de Modal Genérico.
 * @module ui/components/modal
 * @description Este módulo fornece uma estrutura para criar, renderizar e controlar o estado
 * (abrir/fechar) de diferentes tipos de modais na aplicação, como o modal de "Histórico de Cálculos"
 * e o de "Configurações". Ele gerencia a criação do DOM do modal, o backdrop e as interações de fechamento.
 */

import { getHistory, clearHistory } from '../../services/report.js';
import { state, updateState } from '../../core/state.js';
import { UI_CONFIG } from './uiConfig.js';
import { SUPPORTED_YEARS, initParametros, setAnoParametros, getAnoAtual } from '../../core/parametersStore.js';
import { InputMaskManager, CurrencyFormatter } from '../../services/formatter.js';
import { getSelectedParamYear, setSelectedParamYear, getTheme, setTheme, getUseGlobalSalary, setUseGlobalSalary } from '../../services/storage.js';

/**
 * Referência para o elemento raiz do modal no DOM. É inicializado na primeira vez que um modal é aberto.
 * @private
 * @type {HTMLElement|null}
 */
let modalRoot = null;

/**
 * Garante que o elemento raiz do modal (`#app-modal-root`) exista no DOM, criando-o se necessário.
 * Esta função é "lazy", ou seja, só cria o DOM do modal na primeira vez que ele é necessário,
 * otimizando o carregamento inicial da página.
 * @private
 * @returns {HTMLElement} O elemento raiz do modal.
 */
function ensureRoot() {
	if (modalRoot) return modalRoot;
	modalRoot = document.createElement('div');
	modalRoot.id = 'app-modal-root';
	modalRoot.className = 'fixed inset-0 hidden';
	modalRoot.setAttribute('data-theme','system');
	const modalMaxWidth = UI_CONFIG?.modal?.maxWidthClass || 'max-w-3xl';
	const modalMaxHeight = UI_CONFIG?.modal?.maxHeightClass || 'max-h-[90vh]';
	modalRoot.innerHTML = `
		<div class="fixed inset-0 modal-backdrop opacity-0 transition-opacity duration-300 hidden" data-role="backdrop"></div>
		<div class="absolute inset-0 pointer-events-none">
			<div id="app-modal-card" class="absolute left-4 top-4 w-full ${modalMaxWidth} ${modalMaxHeight} pointer-events-auto modal-card rounded-lg shadow-lg animate-fade-in overflow-auto bg-surface text-default border-default">
				<div class="flex items-center justify-between px-6 py-4 border-b">
					<h3 class="text-lg font-semibold leading-tight" id="app-modal-title">Histórico</h3>
					<button class="p-1 rounded hover:bg-surface/50" data-role="close"><span class="material-icons-outlined">close</span></button>
				</div>
				<div id="app-modal-content" class="p-4"></div>
			</div>
		</div>`;
	document.body.appendChild(modalRoot);

	/**
	 * Aplica o tema visual (claro/escuro) ao modal e ao seu backdrop.
	 * @param {string} theme - O tema a ser aplicado ('light', 'dark', ou 'system').
	 */
	function applyModalTheme(theme){
		const root = modalRoot;
		if (!root) return;
		const backdrop = root.querySelector('[data-role="backdrop"]');
		let finalTheme = theme;
		if (theme === 'system' || !theme) {
			finalTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
		}
		root.setAttribute('data-theme', finalTheme);
		if (backdrop){
			backdrop.style.backgroundColor = finalTheme === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.35)';
		}
	}

	modalRoot.applyModalTheme = applyModalTheme;
	modalRoot.addEventListener('click', (e) => {
		const t = e.target;
		if (t.closest('[data-role="close"]') || t.closest('[data-role="backdrop"]')) closeModal();
	});
	return modalRoot;
}

/**
 * Abre e renderiza o modal de "Histórico de Cálculos".
 * Busca o histórico de cálculos do serviço de relatórios e o exibe em uma lista.
 * Se não houver histórico, exibe uma mensagem informativa.
 */
export function openHistoryModal() {
	const root = ensureRoot();
	const list = getHistory();
	const content = root.querySelector('#app-modal-content');
	const title = root.querySelector('#app-modal-title');
	title.textContent = 'Histórico de Cálculos';
	if (!list.length) {
		content.innerHTML = '<p class="text-sm text-muted-foreground">Nenhum cálculo foi registrado.</p>';
	} else {
		content.innerHTML = `
			<div class="flex justify-between items-center mb-3">
				<div class="text-sm text-muted-foreground">Total: ${list.length} ${list.length === 1 ? 'registro' : 'registros'}</div>
				<button id="btn-clear-history" class="btn btn-secondary">Limpar Histórico</button>
			</div>
			<div class="divide-y">
				${list.map(e => `
					<div class="py-3 text-sm">
						<div class="flex items-center justify-between">
							<div class="font-medium">${e.calc}</div>
							<div class="text-xs text-muted-foreground">${new Date(e.when).toLocaleString('pt-BR')}</div>
						</div>
						<div class="mt-1 grid grid-cols-2 gap-2">
							<div class="text-xs text-muted-foreground">Dados de Entrada</div>
							<div class="text-xs text-muted-foreground">Resultado</div>
							<pre class="bg-muted/30 p-2 rounded overflow-x-auto text-[11px]">${escapeHtml(JSON.stringify(e.input, null, 2))}</pre>
							<pre class="bg-muted/30 p-2 rounded overflow-x-auto text-[11px]">${escapeHtml(JSON.stringify(e.result, null, 2))}</pre>
						</div>
					</div>`).join('')}
			</div>`;
		const clearBtn = content.querySelector('#btn-clear-history');
	
		if (clearBtn && !clearBtn.dataset.bound) {
			clearBtn.addEventListener('click', () => { clearHistory(); openHistoryModal(); });
			clearBtn.dataset.bound = '1';
		}
	}
	root.classList.remove('hidden');
	const backdrop = root.querySelector('[data-role="backdrop"]');
	if (backdrop) {
		backdrop.classList.remove('hidden');
		backdrop.style.pointerEvents = 'auto';
		setTimeout(()=>backdrop.classList.remove('opacity-0'), 10);
		if (root.applyModalTheme) root.applyModalTheme(state?.ui?.theme || getTheme('system'));
	}
}

/**
 * Abre e renderiza o modal de "Configurações".
 * Constrói um formulário que permite ao usuário alterar configurações globais,
 * como o ano dos parâmetros de cálculo, o tema da interface e o salário bruto global.
 * Também posiciona o modal de forma inteligente próximo ao botão de configurações.
 */
export function openSettingsModal(){
	const root = ensureRoot();
	const content = root.querySelector('#app-modal-content');
	const title = root.querySelector('#app-modal-title');
	title.textContent = 'Configurações';
	const anos = [...SUPPORTED_YEARS].sort((a,b)=>b-a);
	const currentYear = getAnoAtual();
	const theme = getTheme(state.ui.theme || 'system');
	const salarioBrutoGlobal = (()=>{
		const keys = ['ferias','rescisao','decimoTerceiro','salarioLiquido','fgts','horasExtras','inss','valeTransporte','irpf'];
		for (const k of keys){ if (state[k]?.salarioBruto) return state[k].salarioBruto; }
		return 0;
	})();
	const salarioFormatado = typeof CurrencyFormatter?.format==='function'? CurrencyFormatter.format(salarioBrutoGlobal): salarioBrutoGlobal;
	const useGlobalSalario = getUseGlobalSalary(true);
	content.innerHTML = `
		<form id="settings-form" class="space-y-6">
			<div class="space-y-2">
				<label class="text-sm font-medium flex items-center gap-1" for="settings-salario">Salário Bruto Global <span class="material-icons-outlined text-xs cursor-help" data-tooltip="Define um valor de salário bruto padrão para todas as calculadoras.">help_outline</span></label>
				<input id="settings-salario" type="text" class="input money-mask" value="${salarioFormatado}" placeholder="R$ 0,00">
				<p class="text-xs text-muted-foreground">Este valor será usado como padrão nos campos de salário bruto.</p>
			</div>
			<div class="space-y-2">
				<label class="text-sm font-medium flex items-center gap-2">Sincronização Automática</label>
				<div class="flex items-center gap-3">
					<input id="settings-use-global-salario" type="checkbox" class="checkbox" ${useGlobalSalario? 'checked':''}>
					<div class="text-sm text-muted-foreground">Quando esta opção está ativa, a alteração do salário em qualquer calculadora atualiza o valor global e o replica para as demais.</div>
				</div>
			</div>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div class="space-y-2">
					<label class="text-sm font-medium" for="settings-ano">Parâmetros de Cálculo (Ano)</label>
					<select id="settings-ano" class="input">
						${anos.map(y=>`<option value="${y}" ${y===currentYear? 'selected':''}>${y}</option>`).join('')}
					</select>
				</div>
				<div class="space-y-2">
					<label class="text-sm font-medium" for="settings-theme">Aparência da Interface</label>
					<select id="settings-theme" class="input">
						<option value="system" ${theme==='system'?'selected':''}>Padrão do Sistema</option>
						<option value="light" ${theme==='light'?'selected':''}>Tema Claro</option>
						<option value="dark" ${theme==='dark'?'selected':''}>Tema Escuro</option>
					</select>
				</div>
			</div>
			<div class="flex justify-end gap-2 pt-2 border-t">
				<button type="button" class="btn btn-secondary" data-role="close">Fechar</button>
				<button type="submit" class="btn btn-primary">Salvar Configurações</button>
			</div>
		</form>`;
	try { content.querySelectorAll('.money-mask').forEach(el=>InputMaskManager.applyCurrencyMask(el)); } catch(_e){}
	const form = content.querySelector('#settings-form');
	if (form && !form.dataset.bound){
		form.addEventListener('submit', async (e)=>{
			e.preventDefault();
			const salarioEl = form.querySelector('#settings-salario');
			const anoEl = form.querySelector('#settings-ano');
			const themeEl = form.querySelector('#settings-theme');
            const useGlobalEl = form.querySelector('#settings-use-global-salario');
			const salarioNum = typeof CurrencyFormatter?.unmask==='function'? CurrencyFormatter.unmask(salarioEl.value||''):0;
			if (salarioNum>0){
				const targets = ['ferias','rescisao','decimoTerceiro','salarioLiquido','fgts','horasExtras','inss','valeTransporte','irpf'];
				targets.forEach(t=>{ try { updateState(`${t}.salarioBruto`, salarioNum); } catch(_e){} });
				document.querySelectorAll('input.money-mask[data-state$=".salarioBruto"]').forEach(el=>{
					try { el.setAttribute('data-syncing-salario','1'); } catch(_e){}
					const f = typeof CurrencyFormatter?.format==='function'? CurrencyFormatter.format(salarioNum):salarioNum;
					el.value = f;
					try { el.removeAttribute('data-syncing-salario'); } catch(_e){}
				});
			}
			const ano = Number(anoEl.value);
			if (!isNaN(ano) && SUPPORTED_YEARS.includes(ano)){
				try {
					await setAnoParametros(ano);
					await initParametros(ano);
					setSelectedParamYear(ano);
				} catch(err){ console.error('[settings] Falha ao aplicar ano', ano, err); }
			}
			const theme = themeEl.value;
			try { setTheme(theme); state.ui.theme = theme; document.documentElement.classList.toggle('dark', theme==='dark' || (theme==='system' && window.matchMedia('(prefers-color-scheme: dark)').matches)); } catch(_e){}
			try { const rootEl = ensureRoot(); if (rootEl && rootEl.applyModalTheme) rootEl.applyModalTheme(theme); } catch(_e){}
			try {
				const useGlobal = !!(useGlobalEl && useGlobalEl.checked);
				setUseGlobalSalary(useGlobal);
				state.ui.useGlobalSalary = useGlobal;
			} catch(_e){}
			closeModal();
		});
		form.dataset.bound='1';
	}
	root.classList.remove('hidden');
	const backdrop = root.querySelector('[data-role="backdrop"]');
	if (backdrop) {
		backdrop.classList.remove('hidden');
		backdrop.style.pointerEvents = 'auto';
		setTimeout(()=>backdrop.classList.remove('opacity-0'), 10);
		if (root.applyModalTheme) root.applyModalTheme(state?.ui?.theme || getTheme('system'));
	}

	requestAnimationFrame(()=>{
		const card = document.getElementById('app-modal-card');
		const btn = document.getElementById('btn-open-settings');
		if (card && btn){
			const rect = btn.getBoundingClientRect();
			let top = rect.bottom + 8;
			let left = rect.left;
			const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
			const cardW = Math.min(card.offsetWidth || 0, vw - 32);
			if (left + cardW + 16 > vw) left = vw - cardW - 16;
			const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
			const cardH = Math.min(card.offsetHeight || 0, vh - 32);
			if (top + cardH + 16 > vh) {
				top = rect.top - cardH - 8;
				if (top < 8) top = 8;
			}
			card.style.left = `${left}px`;
			card.style.top = `${top}px`;
		}
	});
}

/**
 * Fecha o modal atualmente aberto, aplicando uma animação de fade-out ao backdrop
 * e escondendo os elementos do modal após a transição.
 */
export function closeModal(){
	const root = ensureRoot();
	const backdrop = root.querySelector('[data-role="backdrop"]');
	if (backdrop) {
		backdrop.classList.add('opacity-0');
		backdrop.style.pointerEvents = 'none';
	}
	setTimeout(()=>{
		if (backdrop) backdrop.classList.add('hidden');
		root.classList.add('hidden');
	}, 300);
}

/**
 * Escapa caracteres HTML em uma string para prevenir a injeção de scripts (XSS)
 * ao renderizar conteúdo gerado pelo usuário ou dados JSON no DOM.
 * @private
 * @param {string} str - A string a ser escapada.
 * @returns {string} A string com os caracteres HTML perigosos substituídos por suas entidades correspondentes.
 */
function escapeHtml(str){
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

/**
 * Alias de `openHistoryModal` em português para consistência.
 * @type {typeof openHistoryModal}
 */
export const abrirModalHistorico = openHistoryModal;
/**
 * Alias de `openSettingsModal` em português para consistência.
 * @type {typeof openSettingsModal}
 */
export const abrirModalConfiguracoes = openSettingsModal;
/**
 * Alias de `closeModal` em português para consistência.
 * @type {typeof closeModal}
 */
export const fecharModal = closeModal;
