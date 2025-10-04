/**
 * @file Componente de UI para Tooltips (Dicas de Ferramenta).
 * @module ui/components/tooltip
 * @description Este módulo implementa um sistema de tooltips leve e sem dependências.
 * Ele usa delegação de eventos para exibir uma dica de ferramenta para qualquer elemento
 * no DOM que possua o atributo `data-tooltip`. O sistema também oferece suporte
 * para acessibilidade, exibindo tooltips em eventos de foco.
 */

/**
 * Armazena a referência para o elemento DOM do tooltip, que é criado uma única vez.
 * @private
 * @type {HTMLElement|null}
 */
let tooltipEl = null;

/**
 * Armazena o ID do temporizador usado para esconder o tooltip após um delay,
 * permitindo um fade-out suave.
 * @private
 * @type {number|null}
 */
let hideTimer = null;

/**
 * Garante que o elemento do tooltip exista no DOM, criando-o e aplicando
 * estilos inline na primeira vez que for necessário.
 * @private
 * @returns {HTMLElement} O elemento DOM do tooltip.
 */
function ensureTooltipEl() {
	if (tooltipEl) return tooltipEl;
	tooltipEl = document.createElement('div');
	tooltipEl.id = 'app-tooltip';
	tooltipEl.setAttribute('role', 'tooltip');
	tooltipEl.style.position = 'fixed';
	tooltipEl.style.zIndex = '9999';
	tooltipEl.style.maxWidth = '320px';
	tooltipEl.style.fontSize = '12px';
	tooltipEl.style.lineHeight = '1.3';
	tooltipEl.style.color = 'rgb(23 23 23)';
	tooltipEl.style.background = 'rgba(255,255,255,0.98)';
	tooltipEl.style.border = '1px solid rgba(0,0,0,0.1)';
	tooltipEl.style.borderRadius = '6px';
	tooltipEl.style.boxShadow = '0 10px 20px rgba(0,0,0,0.12)';
	tooltipEl.style.padding = '8px 10px';
	tooltipEl.style.pointerEvents = 'none';
	tooltipEl.style.opacity = '0';
	tooltipEl.style.transform = 'translateY(-4px)';
	tooltipEl.style.transition = 'opacity 120ms ease, transform 120ms ease';
	document.body.appendChild(tooltipEl);
	return tooltipEl;
}

/**
 * Torna o tooltip visível, define seu conteúdo e o posiciona na tela.
 * @private
 * @param {string} text - O texto a ser exibido no tooltip.
 * @param {number} x - A coordenada X (horizontal) para posicionar o tooltip.
 * @param {number} y - A coordenada Y (vertical) para posicionar o tooltip.
 */
function show(text, x, y) {
	const el = ensureTooltipEl();
	el.textContent = text;
	el.style.left = `${Math.round(x)}px`;
	el.style.top = `${Math.round(y)}px`;
	clearTimeout(hideTimer);
	requestAnimationFrame(() => {
		el.style.opacity = '1';
		el.style.transform = 'translateY(0)';
	});
}

/**
 * Esconde o tooltip aplicando uma animação de fade-out e limpando seu conteúdo.
 * @private
 */
function hide() {
	if (!tooltipEl) return;
	tooltipEl.style.opacity = '0';
	tooltipEl.style.transform = 'translateY(-4px)';
	clearTimeout(hideTimer);
	hideTimer = setTimeout(() => {
		if (tooltipEl) tooltipEl.textContent = '';
	}, 150);
}

/**
 * Calcula a posição ideal para o tooltip com base nas dimensões e na posição do elemento alvo.
 * A posição é calculada para que o tooltip apareça acima do elemento, com ajustes para
 * não ultrapassar as bordas da janela.
 * @private
 * @param {HTMLElement} target - O elemento DOM que acionou o tooltip.
 * @returns {{left: number, top: number}} Um objeto com as coordenadas `left` e `top` calculadas.
 */
function computePosition(target) {
	const rect = target.getBoundingClientRect();
	const top = rect.top - 10; // Posiciona acima com um pequeno offset.
	const left = Math.min(
		Math.max(rect.left, 8), // Garante que não saia pela esquerda.
		window.innerWidth - 328 // Garante que não saia pela direita (largura máxima + margens).
	);
	return { left, top };
}

/**
 * Inicializa os ouvintes de eventos para o sistema de tooltips.
 * Utiliza delegação de eventos no `document` para capturar eventos de `mouseover`,
 * `mouseout`, `focusin` e `focusout` em qualquer elemento com o atributo `data-tooltip`.
 * Esta função é idempotente; ela só anexa os listeners uma vez.
 */
export function initTooltips() {
	if (document.body.dataset.tooltipBound) return;

	// Listener para exibir o tooltip ao passar o mouse.
	document.addEventListener('mouseover', (e) => {
		const target = e.target.closest('[data-tooltip]');
		if (!target) return;
		const text = target.getAttribute('data-tooltip');
		if (!text) return;
		const { left, top } = computePosition(target);
		show(text, left, top);
	}, { capture: true });

	// Listener para esconder o tooltip ao retirar o mouse.
	document.addEventListener('mouseout', (e) => {
		if (e.target.closest('[data-tooltip]')) hide();
	}, { capture: true });

	// Listener para exibir o tooltip ao focar em um elemento (acessibilidade).
	document.addEventListener('focusin', (e) => {
		const target = e.target.closest('[data-tooltip]');
		if (!target) return;
		const text = target.getAttribute('data-tooltip');
		if (!text) return;
		const { left, top } = computePosition(target);
		show(text, left, top);
	});

	// Listener para esconder o tooltip ao perder o foco.
	document.addEventListener('focusout', (e) => {
		if (e.target.closest('[data-tooltip]')) hide();
	});

	document.body.dataset.tooltipBound = '1';
}

/**
 * Alias de `initTooltips` em português para consistência de nomenclatura no projeto.
 * @type {typeof initTooltips}
 */
export const inicializarTooltips = initTooltips;

