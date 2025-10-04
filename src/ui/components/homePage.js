/**
 * @file Componente da Página Inicial.
 * @module ui/components/homePage
 * @description Este módulo é responsável por renderizar o conteúdo dinâmico da página inicial,
 * que serve como um "dashboard" para o usuário. Inclui um simulador rápido, atalhos para as
 * principais calculadoras e uma seção de tópicos em destaque.
 */

import { calculateSalarioLiquido } from '../../core/calculations.js';
import { CurrencyFormatter, InputMaskManager } from '../../services/formatter.js';
import { CALCULATORS } from '../../data/calculators.js';

/**
 * Renderiza o conteúdo completo da página inicial dentro do contêiner `#home-container`.
 * Esta função constrói dinamicamente o HTML da página, incluindo o simulador rápido,
 * a grade de calculadoras e os destaques. Após a renderização, anexa os ouvintes de
 * eventos necessários para a interatividade da página.
 * @async
 * @function
 * @returns {Promise<void>} Uma promessa que resolve quando a renderização e a configuração dos eventos terminam.
 */
export async function renderHomePage(){
	const container = document.getElementById('home-container');
	if (!container) return;

	// Gera o HTML para a grade de calculadoras dinamicamente a partir dos dados.
	const calculatorsHTML = ['ferias', 'rescisao', 'decimoTerceiro', 'salarioLiquido', 'fgts', 'pisPasep', 'seguroDesemprego', 'horasExtras'].map(id => {
		const c = CALCULATORS[id];
		return `
			<a class="card-base card-interactive p-4 text-center calculator-card" href="#" data-calculator="${id}">
				<div class="p-3 rounded-full mb-3 inline-flex items-center justify-center bg-muted/60 text-default">
					<span class="material-icons-outlined">${c.icon}</span>
				</div>
				<h3 class="font-medium text-default text-sm md:text-base">${c.label}</h3>
			</a>`;
	}).join('');

	// Gera o HTML para os tópicos em destaque.
	const articlesHTML = [
		['account_balance','Saque-Aniversário do FGTS','Análise da modalidade opcional de saque anual do FGTS.','open-faq','FGTS'],
		['work','Legislação sobre Teletrabalho','Direitos e deveres no regime de trabalho remoto, conforme a CLT.','open-articles',''],
		['article','Cálculo de Férias com Abono','Instruções para o cálculo de férias com a conversão de 1/3 em abono.','open-faq','férias']
	].map(a => `
		<div class="group flex items-start">
			<div class="rounded-md p-3 mr-5 bg-muted/60">
				<span class="material-icons-outlined text-default">${a[0]}</span>
			</div>
			<div class="flex-1 min-w-0">
				<h3 class="font-medium text-default mb-1 group-hover:text-primary transition-colors">${a[1]}</h3>
				<p class="text-sm text-muted">${a[2]}</p>
				<a class="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium mt-2" href="#" data-action="${a[3]}" ${a[4] ? `data-query="${a[4]}"` : ''}>
					Saber mais <span class="material-icons-outlined text-xs">arrow_forward</span>
				</a>
			</div>
		</div>`
	).join('<div class="divider"></div>');

	// Monta o HTML completo da página.
	const html = `
		<div class="max-w-7xl mx-auto">
			<!-- Seção de Boas-Vindas -->
			<header class="mb-12 mt-2">
				<h1 class="heading-hero text-4xl md:text-5xl text-default">Plataforma de Cálculos Trabalhistas</h1>
				<p class="mt-3 text-lg text-muted prose-tight">Selecione uma calculadora ou consulte a base de conhecimento.</p>
			</header>

			<!-- Grade de Conteúdo Principal -->
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
				<!-- Coluna Esquerda: Conteúdo Principal -->
				<div class="lg:col-span-2">
					<!-- Simulador Rápido -->
					<section class="card-base p-6 mb-12">
						<h2 class="text-lg font-semibold tracking-tight text-default mb-6 flex items-center gap-2">
							<span class="material-icons-outlined text-primary text-base">flash_on</span>
							Simulador Rápido de Salário Líquido
						</h2>
						<div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-end" id="quick-simulator">
							<div class="space-y-2">
								<label class="text-sm font-medium text-default" for="salario-bruto">Salário Bruto</label>
								<input class="input money-mask" id="salario-bruto" type="text" placeholder="R$ 3.500,00" />
							</div>
							<div class="space-y-2">
								<label class="text-sm font-medium text-default" for="dependentes">Dependentes</label>
								<input class="input" id="dependentes" type="number" value="0" min="0" />
							</div>
							<button class="btn btn-primary w-full col-span-1 md:col-auto" id="btn-calculate-quick" type="button">
								<span class="material-icons-outlined text-base">calculate</span>
								Calcular
							</button>
						</div>
						<div id="quick-result" class="mt-5 hidden">
							<div class="rounded-md border border-default bg-subtle p-4">
								<h3 class="font-medium text-default mb-4">Resultado da Simulação</h3>
								<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
									<div><div class="text-muted">Salário Bruto</div><div class="font-semibold" id="result-bruto">R$ 0,00</div></div>
									<div><div class="text-muted">Total de Descontos</div><div class="font-semibold text-negative" id="result-descontos">R$ 0,00</div></div>
									<div><div class="text-muted">Salário Família</div><div class="font-semibold text-positive" id="result-familia">R$ 0,00</div></div>
									<div><div class="text-muted">Salário Líquido</div><div class="font-semibold text-positive text-lg" id="result-liquido">R$ 0,00</div></div>
								</div>
							</div>
						</div>
					</section>

					<!-- Grade de Calculadoras -->
					<section class="mb-12">
						<div class="flex items-center justify-between mb-6">
							<h2 class="text-lg font-semibold tracking-tight text-default">Calculadoras Detalhadas</h2>
							<a class="text-sm font-medium text-primary hover:text-primary/80 flex items-center" href="#" id="show-all-calculators" data-action="activate-calculator" data-calculator="all">
								Ver todas <span class="material-icons-outlined ml-1 text-sm">arrow_forward</span>
							</a>
						</div>
						<div class="grid grid-cols-2 md:grid-cols-4 gap-6" id="calculators-grid">${calculatorsHTML}</div>
					</section>
				</div>

				<!-- Coluna Direita: Destaques e Artigos -->
				<div class="lg:col-span-1">
					<aside class="card-base p-6">
						<h2 class="text-lg font-semibold tracking-tight text-default mb-6 flex items-center gap-2">
							<span class="material-icons-outlined text-primary text-base">insights</span>
							Tópicos em Destaque
						</h2>
						<div class="space-y-6" id="articles-highlights">${articlesHTML}</div>
					</aside>
				</div>
			</div>
		</div>
	`;

	container.innerHTML = html;

	// Aplica máscaras de formatação aos inputs.
	try { 
		container.querySelectorAll('input.money-mask').forEach(el => InputMaskManager.applyCurrencyMask(el)); 
	} catch(_e) {}

	// Adiciona a funcionalidade ao botão de cálculo do simulador rápido.
	const btnCalculate = container.querySelector('#btn-calculate-quick');
	const resultDiv = container.querySelector('#quick-result');
	
	if (btnCalculate) {
		btnCalculate.addEventListener('click', () => {
			const salarioStr = container.querySelector('#salario-bruto')?.value || '';
			const dependentesStr = container.querySelector('#dependentes')?.value || '0';
			
			const salario = CurrencyFormatter.unmask(salarioStr);
			const dependentes = Number(dependentesStr) || 0;
			
			if (salario > 0) {
				const result = calculateSalarioLiquido({ salarioBruto: salario, dependentes });
				
				if (result) {
					container.querySelector('#result-bruto').textContent = CurrencyFormatter.format(result.bruto);
					container.querySelector('#result-descontos').textContent = CurrencyFormatter.format(result.totalDescontos);
					container.querySelector('#result-familia').textContent = CurrencyFormatter.format(result.salarioFamilia);
					container.querySelector('#result-liquido').textContent = CurrencyFormatter.format(result.liquido);
					
					resultDiv.classList.remove('hidden');
				}
			}
		});
	}

	// Adiciona ouvintes de evento para os cartões de atalho das calculadoras.
	container.querySelectorAll('[data-calculator]').forEach(link => {
		link.addEventListener('click', (e) => {
			e.preventDefault();
			const calculator = link.getAttribute('data-calculator');
			// Reutiliza o fluxo de navegação do `renderer` e `state`.
			import('../renderer.js').then(m => {
				import('../../core/state.js').then(stateModule => {
					stateModule.state.activeCalculator = calculator;
					m.renderApp();
				});
			});
		});
	});

	// Adiciona ouvintes de evento para os links de tópicos em destaque.
	container.querySelectorAll('[data-action="open-faq"]').forEach(link => {
		link.addEventListener('click', (e) => {
			e.preventDefault();
			const query = link.getAttribute('data-query') || '';
			// Abre a modal da base de conhecimento e opcionalmente preenche a busca.
			import('../../features/knowledge-base/ui.js').then(m => {
				m.openFaqModal();
				const search = document.getElementById('faq-search-input');
				if (search && query) { 
					search.value = query; 
					search.dispatchEvent(new Event('input')); 
				}
			});
		});
	});

	// Adiciona suporte à tecla Enter para calcular no simulador rápido.
	['#salario-bruto', '#dependentes'].forEach(selector => {
		const input = container.querySelector(selector);
		if (input) {
			input.addEventListener('keydown', (e) => {
				if (e.key === 'Enter') {
					e.preventDefault();
					btnCalculate?.click();
				}
			});
		}
	});
}

