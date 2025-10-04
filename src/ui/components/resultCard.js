/**
 * @file Componentes de Cartão de Resultado.
 * @module ui/components/resultCard
 * @description Este módulo contém um conjunto de funções de renderização puras. Cada função é
 * responsável por pegar um objeto de resultados de um cálculo específico e transformá-lo
 * em uma string de HTML que representa um "cartão de resultados" visual. Estas funções
 * são projetadas para serem independentes de estado e se concentram exclusivamente na
 * apresentação dos dados.
 */

import { CurrencyFormatter } from '../../services/formatter.js';
import { getAnoAtual } from '../../core/parametersStore.js';

/**
 * Gera o HTML para o estado "vazio" de um cartão de resultados, exibido quando
 * o usuário ainda não inseriu dados suficientes para o cálculo.
 * @private
 * @param {string} label - O nome da calculadora para ser exibido na mensagem (ex: "Férias").
 * @returns {string} A string HTML para o estado vazio.
 */
function emptyState(label){
	return `<div class="card-base p-6 text-card-foreground empty-state">
		<div class="icon mb-2">💡</div>
		<p>Preencha os campos para iniciar o cálculo de <strong>${label}</strong>.</p>
	</div>`;
}

/**
 * Gera uma animação de esqueleto de carregamento para ser usada enquanto os dados
 * estão sendo processados, fornecendo feedback visual ao usuário.
 * @private
 * @param {number} [rows=6] - O número de linhas do esqueleto a serem geradas.
 * @returns {string} A string HTML para o esqueleto de carregamento.
 */
function loadingSkeleton(rows = 6){
  const sk = Array.from({length:rows}).map(()=>'<div class="h-4 w-full skeleton"></div>').join('<div class="h-2"></div>');
  return `<div class="space-y-3">${sk}</div>`;
}

/**
 * Envolve um valor em um `<span>` com uma classe CSS específica para estilização
 * consistente de valores monetários.
 * @private
 * @param {*} v - O valor a ser envolvido.
 * @returns {string} A string HTML do valor formatado.
 */
function money(v){ return `<span class="valor-monetario">${v}</span>`; }

/**
 * Cria o HTML para uma linha de "total" em um cartão de resultado, geralmente
 * usada para destacar o valor final principal.
 * @private
 * @param {string} label - O rótulo para a linha de total (ex: "Total Líquido").
 * @param {*} value - O valor a ser exibido.
 * @returns {string} A string HTML para a linha de total.
 */
function totalLine(label, value){
  return `<div class="flex justify-between items-center pt-1 border-t mt-2"><span class="text-xs md:text-sm font-medium tracking-tight">${label}</span><span class="totalizador valor-monetario">${value}</span></div>`;
}

/**
 * @typedef {object} FeriasResult
 * @description Objeto contendo todos os campos de resultado do cálculo de férias.
 * (A estrutura detalhada é definida em `core/calculations.js`)
 */

/**
 * Renderiza o cartão de resultados para o cálculo de Férias.
 * @param {FeriasResult} results - O objeto com os resultados do cálculo.
 * @returns {string} A string HTML do cartão de resultados de Férias.
 */
export function renderFeriasResults(results) {
	if (!results || Object.keys(results).length === 0) {
		return `<div class="card-base p-4">
		<h2 class="text-lg font-semibold mb-3 flex items-center gap-2">Resultados (Férias)</h2>
		${emptyState('Férias')}
	</div>`;
	}

	const sec1 = [
		{ label: 'Dias de Férias', value: results.diasFerias },
		{ label: 'Salário Base', value: CurrencyFormatter.format(results.salarioBruto) },
		{ label: 'Médias (horas extras + adicional noturno)', value: CurrencyFormatter.format(results.mediaHorasExtras + results.mediaAdicionalNoturno) },
		{ label: 'Periculosidade', value: CurrencyFormatter.format(results.periculosidade||0) },
		{ label: 'Insalubridade', value: CurrencyFormatter.format(results.insalubridade||0) },
		{ label: 'Valor do Dia', value: CurrencyFormatter.format(results.valorDia) }
	];
	const sec2 = [
		{ label: 'Remuneração Dias', value: CurrencyFormatter.format(results.remuneracaoDiasFerias) },
		{ label: 'Adicional 1/3', value: CurrencyFormatter.format(results.adicionalUmTerco) },
		{ label: 'Segmento Férias', value: CurrencyFormatter.format(results.segmentoFerias) },
		{ label: 'Abono (1/3 Vendido)', value: CurrencyFormatter.format(results.segmentoAbono) },
		{ label: 'Adiantamento 13º', value: CurrencyFormatter.format(results.segmentoDecimoAdiantado) }
	];
	const sec3 = [
		{ label: 'Base INSS', value: CurrencyFormatter.format(results.baseINSS) },
		{ label: 'INSS', value: CurrencyFormatter.format(results.inss) },
		{ label: 'Base IRRF', value: CurrencyFormatter.format(results.baseIRRF) },
		{ label: 'IRRF', value: CurrencyFormatter.format(results.irrf) },
		{ label: 'FGTS (8%)', value: CurrencyFormatter.format(results.fgts?.valor || 0) }
	];
	const sec4 = [
		{ label: 'Líquido (Férias)', value: CurrencyFormatter.format(results.liquidoSegmentoFerias) },
		{ label: 'Líquido + Abono', value: CurrencyFormatter.format(results.liquidoComAbono) },
		{ label: 'Total líquido', value: CurrencyFormatter.format(results.liquidoComTudo) }
	];

	function renderRows(rows){
		return rows.map(r => `<div class=\"row-pair\"><span>${r.label}</span><span class=\"valor-monetario\">${r.value}</span></div>`).join('');
	}

	const rowsHTML = `
		<div class="section-block space-y-1">${renderRows(sec1)}</div>
		<div class="section-block space-y-1">${renderRows(sec2)}</div>
		<div class="section-block space-y-1">${renderRows(sec3)}</div>
		<div class="section-block space-y-1">${renderRows(sec4)}${totalLine('Total líquido', sec4[2].value)}</div>
	`;

	let warningsHTML = '';
	if (results.warnings?.length) {
		warningsHTML = `<div class="mt-3 alert-warning">
			<ul>${results.warnings.map(w => `<li>⚠ ${w}</li>`).join('')}</ul>
		</div>`;
	}

	let breakdownHTML = '';
	if (results.inssBreakdown || results.irrfFaixa) {
		const inssTable = (results.inssBreakdown || []).map(f => `<tr><td class=\"pr-4\">${f.faixa}</td><td class=\"pr-2\">${(f.aliquota*100).toFixed(1)}%</td><td>${CurrencyFormatter.format(f.parcela)}</td></tr>`).join('');
		const irrfFaixa = results.irrfFaixa ? `<p class=\"text-xs mt-2\">Faixa IRRF: até ${results.irrfFaixa.limit === Infinity ? '∞' : CurrencyFormatter.format(results.irrfFaixa.limit)} | Alíquota ${(results.irrfFaixa.rate*100).toFixed(1)}% | Dedução ${CurrencyFormatter.format(results.irrfFaixa.deduction)}</p>` : '';
		breakdownHTML = `<details class=\"mt-3 group\"><summary class=\"cursor-pointer text-xs text-primary hover:underline\">Ver detalhes de faixas</summary>
		<div class=\"mt-2 rounded border p-2 bg-subtle overflow-auto\">
			<h4 class=\"text-xs font-semibold mb-1\">INSS</h4>
			<table class=\"text-[11px]\"><thead><tr><th class=\"text-left pr-4\">Faixa</th><th class=\"text-left pr-2\">Alíquota</th><th class=\"text-left\">Parcela</th></tr></thead><tbody>${inssTable}</tbody></table>
			${irrfFaixa}
			<p class=\"text-[10px] mt-2 text-muted-foreground\">Modelo simplificado. Conferir legislações vigentes.</p>
		</div></details>`;
	}

	const ano = (()=>{ try { return getAnoAtual(); } catch(_e){ return ''; } })();
	return `<div class="card-base p-4 space-y-3">
		<h2 class="text-lg font-semibold mb-1 flex items-center gap-2">Resultados (Férias) ${ano?`<span class=\"text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/30\">${ano}</span>`:''}</h2>
		<div class="space-y-3">${rowsHTML}</div>
		${warningsHTML}
		${breakdownHTML}
		<p class="text-[11px] text-muted-foreground mt-3">* Bases segregadas: abono e 13º adiantado fora das incidências. [Modelo simplificado]</p>
	</div>`;
}

/**
 * @typedef {object} DecimoTerceiroResult
 * @description Objeto contendo todos os campos de resultado do cálculo de 13º salário.
 */

/**
 * Renderiza o cartão de resultados para o cálculo de 13º Salário.
 * @param {DecimoTerceiroResult} results - O objeto com os resultados do cálculo.
 * @returns {string} A string HTML do cartão de resultados.
 */
export function renderDecimoTerceiroResults(results) {
	if (!results || Object.keys(results).length === 0) {
		return `<div class="card-base p-4">
		<h2 class="text-lg font-semibold mb-3">Resultados (13º)</h2>
		${emptyState('13º Salário')}
	</div>`;
	}

	const sec1 = [
		{ label: 'Meses Trabalhados', value: results.mesesTrabalhados },
		{ label: 'Salário Base', value: CurrencyFormatter.format(results.salarioBruto) },
		{ label: 'Médias (horas extras + adicional noturno)', value: CurrencyFormatter.format(results.mediaHorasExtras + results.mediaAdicionalNoturno) },
		{ label: 'Periculosidade', value: CurrencyFormatter.format(results.periculosidade||0) },
		{ label: 'Insalubridade', value: CurrencyFormatter.format(results.insalubridade||0) },
		{ label: 'Base + Médias', value: CurrencyFormatter.format(results.baseComMedias) }
	];
	const sec2 = [
		{ label: 'Proporcional Bruto', value: CurrencyFormatter.format(results.proporcionalBruto) },
		{ label: '1ª Parcela Teórica (50%)', value: CurrencyFormatter.format(results.primeiraParcelaTeorica) },
		{ label: 'Adiantamento Recebido', value: CurrencyFormatter.format(results.adiantamentoRecebido) },
		{ label: '2ª Parcela (estimada)', value: CurrencyFormatter.format(results.segundaParcela) }
	];
	const sec3 = [
		{ label: 'INSS', value: CurrencyFormatter.format(results.inss) },
		{ label: 'Base IRRF Ajustada', value: CurrencyFormatter.format(results.baseIRRF) },
		{ label: 'IRRF', value: CurrencyFormatter.format(results.irrf) },
		{ label: 'FGTS (informativo)', value: CurrencyFormatter.format(results.fgts?.valor || 0) }
	];
	const sec4 = [
		{ label: 'Líquido Total', value: CurrencyFormatter.format(results.liquidoTotal) }
	];

	function rows(rows){
		return rows.map(r => `<div class=\"row-pair\"><span>${r.label}</span><span class=\"valor-monetario\">${r.value}</span></div>`).join('');
	}

	let warningsHTML = '';
	if (results.warnings?.length) {
		warningsHTML = `<div class="mt-3 alert-warning">
			<ul>${results.warnings.map(w => `<li>⚠ ${w}</li>`).join('')}</ul>
		</div>`;
	}

	let breakdownHTML = '';
	if (results.inssBreakdown || results.irrfFaixa) {
		const inssTable = (results.inssBreakdown || []).map(f => `<tr><td class=\"pr-4\">${f.faixa}</td><td class=\"pr-2\">${(f.aliquota*100).toFixed(1)}%</td><td>${CurrencyFormatter.format(f.parcela)}</td></tr>`).join('');
		const irrfFaixa = results.irrfFaixa ? `<p class=\"text-xs mt-2\">Faixa IRRF: até ${results.irrfFaixa.limit === Infinity ? '∞' : CurrencyFormatter.format(results.irrfFaixa.limit)} | Alíquota ${(results.irrfFaixa.rate*100).toFixed(1)}% | Dedução ${CurrencyFormatter.format(results.irrfFaixa.deduction)}</p>` : '';
		breakdownHTML = `<details class=\"mt-3 group\"><summary class=\"cursor-pointer text-xs text-primary hover:underline\">Ver detalhes de faixas</summary>
		<div class=\"mt-2 rounded border p-2 bg-subtle overflow-auto\">
			<h4 class=\"text-xs font-semibold mb-1\">INSS</h4>
			<table class=\"text-[11px]\"><thead><tr><th class=\"text-left pr-4\">Faixa</th><th class=\"text-left pr-2\">Alíquota</th><th class=\"text-left\">Parcela</th></tr></thead><tbody>${inssTable}</tbody></table>
			${irrfFaixa}
			<p class=\"text-[10px] mt-2 text-muted-foreground\">Modelo simplificado. Conferir legislações vigentes.</p>
		</div></details>`;
	}

	const ano = (()=>{ try { return getAnoAtual(); } catch(_e){ return ''; } })();
	return `<div class="card-base p-4 space-y-3">
		<h2 class=\"text-lg font-semibold mb-1 flex items-center gap-2\">Resultados (13º) ${ano?`<span class=\\"text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/30\\">${ano}</span>`:''}</h2>
		<div class=\"space-y-3\">
			<div class=\"section-block space-y-1\">${rows(sec1)}</div>
			<div class=\"section-block space-y-1\">${rows(sec2)}</div>
			<div class=\"section-block space-y-1\">${rows(sec3)}</div>
			<div class=\"section-block space-y-1\">${rows(sec4)}${totalLine('Líquido Total', sec4[0].value)}</div>
		</div>
		${warningsHTML}
		${breakdownHTML}
		<p class=\"text-[11px] text-muted-foreground mt-3\">* INSS/IRRF sobre a base proporcional integral. FGTS exibido apenas como referência.</p>
	</div>`;
}

/**
 * @typedef {object} RescisaoResult
 * @description Objeto contendo todos os campos de resultado do cálculo de rescisão.
 */

/**
 * Renderiza o cartão de resultados para o cálculo de Rescisão de Contrato.
 * @param {RescisaoResult} results - O objeto com os resultados do cálculo.
 * @returns {string} A string HTML do cartão de resultados.
 */
export function renderRescisaoResults(results) {
    if (!results || Object.keys(results).length === 0 || !results.motivo) {
        return `<div class="card-base p-4">
            <h2 class="text-lg font-semibold mb-3">Resultados (Rescisão)</h2>
            ${emptyState('Rescisão')}
        </div>`;
    }

    const formatCurrency = (value) => CurrencyFormatter.format(value || 0);

    const verbas = [
        { label: 'Saldo de Salário', value: formatCurrency(results.saldoSalario) },
        { label: 'Aviso Prévio Indenizado', value: formatCurrency(results.avisoIndenizado) },
        { label: 'Férias Vencidas', value: formatCurrency(results.feriasVencidas) },
        { label: '1/3 sobre Férias Vencidas', value: formatCurrency(results.tercoFeriasVencidas) },
        { label: 'Férias Proporcionais', value: formatCurrency(results.feriasProporcionais) },
        { label: '1/3 sobre Férias Proporcionais', value: formatCurrency(results.tercoFeriasProporcionais) },
        { label: '13º Salário Proporcional', value: formatCurrency(results.decimoProporcional) },
    ];

    const descontos = [
        { label: 'INSS sobre Saldo de Salário', value: formatCurrency(results.inssBreakdown?.find(i => i.tipo === 'folha')?.valor || (results.inss - (results.inssBreakdown?.find(i => i.tipo === '13o')?.valor || 0))) },
        { label: 'INSS sobre 13º Salário', value: formatCurrency(results.inssBreakdown?.find(i => i.tipo === '13o')?.valor || 0) },
        { label: 'IRRF sobre Folha', value: formatCurrency(results.irrfBreakdown?.folha.valor || 0) },
        { label: 'IRRF sobre 13º', value: formatCurrency(results.irrfBreakdown?.decimo.valor || 0) },
        { label: 'Outros Descontos (VT, VR, etc.)', value: formatCurrency(results.outrosDescontos) },
    ];

    const fgts = [
        { label: 'Saldo para fins rescisórios', value: formatCurrency(results.saldoFgtsUtilizado) },
        { label: 'Depósitos do mês na rescisão', value: formatCurrency(results.fgtsReflex?.total || 0) },
        { label: 'Multa de 40% (ou 20%)', value: formatCurrency(results.multaFGTS) },
    ];

    const totalVerbas = results.totalBruto - results.multaFGTS;
    const totalDescontos = results.totalDescontos;
    const totalLiquido = results.totalLiquidoSemMulta;
    const totalSaqueFGTS = results.saldoFgtsUtilizado + (results.fgtsReflex?.total || 0) + results.multaFGTS;

    const renderSection = (title, items, totalLabel, totalValue) => `
        <div class="section-block border-b pb-3 mb-3">
            <h3 class="text-md font-semibold mb-2">${title}</h3>
            <div class="space-y-1">
                ${items.map(item => `<div class="row-pair"><span>${item.label}</span><span class="valor-monetario">${item.value}</span></div>`).join('')}
            </div>
            ${totalLine(totalLabel, formatCurrency(totalValue))}
        </div>
    `;

    const ano = (() => { try { return getAnoAtual(); } catch(e){ return ''; } })();
    const title = `Resultados (Rescisão) ${ano ? `<span class="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/30">${ano}</span>` : ''}`;

    let warningsHTML = '';
    if (results.warnings?.length) {
        warningsHTML = `<div class="mt-3 alert-warning"><ul>${results.warnings.map(w => `<li>⚠ ${w}</li>`).join('')}</ul></div>`;
    }

    return `<div class="card-base p-4 space-y-3">
        <h2 class="text-lg font-semibold mb-1 flex items-center gap-2">${title}</h2>
        <div class="grid grid-cols-1 md:grid-cols-1 gap-4">
            ${renderSection('Verbas Rescisórias', verbas, 'Total de Verbas', totalVerbas)}
            ${renderSection('Descontos', descontos, 'Total de Descontos', totalDescontos)}
            ${renderSection('FGTS', fgts, 'Total para Saque', totalSaqueFGTS)}
        </div>
        <div class="flex justify-between items-center pt-3 border-t-2 mt-4 font-bold text-lg">
            <span>Total Líquido a Receber</span>
            <span class="totalizador valor-monetario">${formatCurrency(totalLiquido)}</span>
        </div>
        ${warningsHTML}
        <p class="text-[11px] text-muted-foreground mt-3">* Valores estimados. Não substitui o Termo de Rescisão de Contrato de Trabalho (TRCT) oficial.</p>
    </div>`;
}

/**
 * Gera um cartão de resultado genérico para o estado vazio.
 * @private
 * @param {string} label - O nome da calculadora (ex: "FGTS").
 * @returns {string} A string HTML do cartão vazio.
 */
function genericEmpty(label){
	return `<div class="card-base p-4"><h2 class="text-lg font-semibold mb-3">Resultados (${label})</h2>${emptyState(label)}</div>`;
}

/**
 * Renderiza o cartão de resultados para a calculadora de FGTS.
 * @param {object} r - O objeto com os resultados do cálculo.
 * @returns {string} A string HTML do cartão de resultados.
 */
export function renderFGTSResults(r) {
    if (!r || Object.keys(r).length === 0 || !r.mesesContribuicao) return genericEmpty('FGTS');

    const warningsHTML = r.warnings?.length
        ? `<div class="mt-3 alert-warning"><ul>${r.warnings.map(w => `<li>⚠ ${w}</li>`).join('')}</ul></div>`
        : '';

    if (warningsHTML) {
        return `<div class="card-base p-4">${warningsHTML}</div>`;
    }

    const rendimentosEstimados = r.saldoComJuros - r.saldoFinalEstimado;

    const rows = [
        ['Valor Total Depositado', CurrencyFormatter.format(r.saldoFinalEstimado)],
        ['Rendimentos Estimados (TR+3%)', CurrencyFormatter.format(rendimentosEstimados)],
        [], // Separator
        ['Depósito Mensal', CurrencyFormatter.format(r.depositoMensal)],
        ['Meses de Contribuição', r.mesesContribuicao],
    ].map(x => {
        if (x.length === 0) return '<hr class="my-2 border-dashed">';
        return `<div class="row-pair"><span>${x[0]}</span><span class="valor-monetario">${x[1]}</span></div>`
    }).join('');

    const ano = (() => { try { return getAnoAtual(); } catch(e){ return ''; } })();
    const title = `Resultados (FGTS) ${ano ? `<span class="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/30">${ano}</span>` : ''}`;

    return `<div class="card-base p-4">
                <h2 class="text-lg font-semibold mb-3 flex items-center gap-2">${title}</h2>

                <div class="text-center p-4 my-2 bg-muted/30 rounded-lg">
                    <span class="text-sm text-muted-foreground">Saldo Final Estimado</span>
                    <p class="text-3xl font-bold text-primary">${CurrencyFormatter.format(r.saldoComJuros)}</p>
                </div>

                <h3 class="text-md font-semibold mt-4 mb-2">Detalhes do Cálculo</h3>
                <div class="space-y-1 text-sm">${rows}</div>

                <p class="text-[11px] text-muted-foreground mt-4">* O cálculo de juros é uma estimativa baseada em dados históricos da TR. O valor real pode variar.</p>
            </div>`;
}

/**
 * Renderiza o cartão de resultados para a calculadora de PIS/PASEP.
 * @param {object} r - O objeto com os resultados do cálculo.
 * @returns {string} A string HTML do cartão de resultados.
 */
export function renderPISPASEPResults(r){
	if (!r || Object.keys(r).length===0) return genericEmpty('PIS/PASEP');
	const rows = [
		['Meses', r.meses],
		['Salário Médio', CurrencyFormatter.format(r.salarioMedio)],
		['Salário Mínimo Ref.', CurrencyFormatter.format(r.salarioMinimoRef)],
		['Elegível', r.elegivel ? 'Sim' : 'Não'],
		['Valor Integral', CurrencyFormatter.format(r.valorIntegral)],
		['Valor Proporcional', CurrencyFormatter.format(r.valorProporcional)]
	].map(x=>`<div class="row-pair"><span>${x[0]}</span><span class="valor-monetario">${x[1]}</span></div>`).join('');
	return `<div class="card-base p-4"><h2 class="text-lg font-semibold mb-3">Resultados (PIS/PASEP)</h2><div class="space-y-1">${rows}</div>${totalLine('Valor Proporcional', CurrencyFormatter.format(r.valorProporcional))}</div>`;
}

/**
 * Renderiza o cartão de resultados para a calculadora de Seguro-Desemprego.
 * @param {object} r - O objeto com os resultados do cálculo.
 * @returns {string} A string HTML do cartão de resultados.
 */
export function renderSeguroDesempregoResults(r){
    if (!r || !r.valorTotal) return genericEmpty('Seguro-Desemprego');
    const rows = [
        ['Média Salarial', CurrencyFormatter.format(r.mediaSalarial)],
        ['Valor da Parcela', CurrencyFormatter.format(r.valorParcela)],
        ['Número de Parcelas', r.numeroParcelas],
        ['Valor Total a Receber', CurrencyFormatter.format(r.valorTotal)],
    ].map(x => `<div class="row-pair"><span>${x[0]}</span><span class="valor-monetario">${x[1]}</span></div>`).join('');

    const ano = (() => { try { return getAnoAtual(); } catch(e){ return ''; } })();
    const title = `Resultados (Seguro-Desemprego) ${ano ? `<span class="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/30">${ano}</span>` : ''}`;

    return `<div class="card-base p-4">
                <h2 class="text-lg font-semibold mb-3 flex items-center gap-2">${title}</h2>
                <div class="space-y-1">${rows}</div>
                ${totalLine('Total a Receber', CurrencyFormatter.format(r.valorTotal))}
                <p class="text-[11px] text-muted-foreground mt-2">* O cálculo utiliza as regras e tabelas oficiais de 2025. O valor é uma estimativa.</p>
            </div>`;
}

/**
 * Renderiza o cartão de resultados para a calculadora de Horas Extras.
 * @param {object} r - O objeto com os resultados do cálculo.
 * @returns {string} A string HTML do cartão de resultados.
 */
export function renderHorasExtrasResults(r){
	if (!r || Object.keys(r).length===0) return genericEmpty('Horas Extras');
	const rows = [
		['Carga Horária', r.carga],
		['Valor Hora', CurrencyFormatter.format(r.valorHora)],
		['Horas Extras', r.horasExtras],
		['Adicional (%)', r.adicionalPercent.toFixed(2)+'%'],
		['Valor Horas Extras', CurrencyFormatter.format(r.valorHoras)]
	].map(x=>`<div class="row-pair"><span>${x[0]}</span><span class="valor-monetario">${x[1]}</span></div>`).join('');
	return `<div class="card-base p-4"><h2 class="text-lg font-semibold mb-3">Resultados (Horas Extras)</h2><div class="space-y-1">${rows}</div>${totalLine('Valor Extras', CurrencyFormatter.format(r.valorHoras))}</div>`;
}

/**
 * Renderiza o cartão de resultados para a calculadora de INSS.
 * @param {object} r - O objeto com os resultados do cálculo.
 * @returns {string} A string HTML do cartão de resultados.
 */
export function renderINSSCalculatorResults(r){
	if (!r || Object.keys(r).length===0) return genericEmpty('INSS');
	const faixas = (r.faixas||[]).map(f=>`<tr><td class="pr-3">${f.faixa}</td><td class="pr-2">${(f.aliquota*100).toFixed(1)}%</td><td>${CurrencyFormatter.format(f.parcela)}</td></tr>`).join('');
	return `<div class="card-base p-4 space-y-3"><h2 class="text-lg font-semibold mb-1">Resultados (INSS)</h2><div class="space-y-1"><div class="row-pair"><span>Salário</span><span class="valor-monetario">${CurrencyFormatter.format(r.salario)}</span></div><div class="row-pair"><span>Contribuição</span><span class="valor-monetario">${CurrencyFormatter.format(r.contribuicao)}</span></div>${totalLine('Total', CurrencyFormatter.format(r.contribuicao))}</div><details class="group"><summary class="cursor-pointer text-xs text-primary hover:underline">Detalhamento Faixas</summary><div class="mt-2 overflow-auto rounded border p-2 bg-subtle"><table class="text-[11px]"><thead><tr><th class="text-left pr-3">Faixa</th><th class="text-left pr-2">Alíq.</th><th class="text-left">Parcela</th></tr></thead><tbody>${faixas}</tbody></table></div></details></div>`;
}

/**
 * Renderiza o cartão de resultados para a calculadora de Vale-Transporte.
 * @param {object} r - O objeto com os resultados do cálculo.
 * @returns {string} A string HTML do cartão de resultados.
 */
export function renderValeTransporteResults(r){
	if (!r || Object.keys(r).length===0) return genericEmpty('Vale-Transporte');
	const rows = [
		['Salário', CurrencyFormatter.format(r.salario)],
		['Custo Diário', CurrencyFormatter.format(r.custoDiario)],
		['Dias', r.dias],
		['Custo Total', CurrencyFormatter.format(r.custoTotal)],
		['Desconto Máx Empregado', CurrencyFormatter.format(r.descontoMax)],
		['Desconto Empregado', CurrencyFormatter.format(r.descontoEmpregado)],
		['Subsídeo Empresa', CurrencyFormatter.format(r.subsidioEmpresa)]
	].map(x=>`<div class="row-pair"><span>${x[0]}</span><span class="valor-monetario">${x[1]}</span></div>`).join('');
	return `<div class="card-base p-4"><h2 class="text-lg font-semibold mb-3">Resultados (Vale-Transporte)</h2><div class="space-y-1">${rows}</div>${totalLine('Custo Total', CurrencyFormatter.format(r.custoTotal))}</div>`;
}

/**
 * Renderiza o cartão de resultados para a calculadora de IRPF.
 * @param {object} r - O objeto com os resultados do cálculo.
 * @returns {string} A string HTML do cartão de resultados.
 */
export function renderIRPFResults(r){
	if (!r || Object.keys(r).length===0) return genericEmpty('IRPF');
	const rows = [
		['Rendimento Anual', CurrencyFormatter.format(r.rendimentoAnual)],
		['Deduções', CurrencyFormatter.format(r.deducoesTotais)],
		['Base Cálculo', CurrencyFormatter.format(r.base)],
		['Imposto Anual', CurrencyFormatter.format(r.impostoAnual)],
		['Alíquota Efetiva', r.aliquotaEfetiva.toFixed(2)+'%']
	].map(x=>`<div class="row-pair"><span>${x[0]}</span><span class="valor-monetario">${x[1]}</span></div>`).join('');
	const faixa = r.faixa ? `<p class="text-[11px] mt-2">Faixa aplicada mensal: até ${r.faixa.limit===Infinity?'∞':CurrencyFormatter.format(r.faixa.limit)} | Alíquota ${(r.faixa.rate*100).toFixed(1)}% | Dedução ${CurrencyFormatter.format(r.faixa.deduction)} (escala anual simplificada)</p>`:'';
	return `<div class="card-base p-4"><h2 class="text-lg font-semibold mb-3">Resultados (IRPF)</h2><div class="space-y-1">${rows}</div>${totalLine('Imposto Anual', CurrencyFormatter.format(r.impostoAnual))}${faixa}<p class="text-[11px] text-muted-foreground mt-2">Modelo estimativo. Não substitui cálculo oficial da DIRPF.</p></div>`;
}

/**
 * Renderiza o cartão de resultados para o cálculo de Salário Líquido.
 * @param {object} r - O objeto com os resultados do cálculo.
 * @returns {string} A string HTML do cartão de resultados.
 */
export function renderSalarioLiquidoResults(r){
	if (!r || Object.keys(r).length===0) return genericEmpty('Salário Líquido');
	const sec1 = [
		['Salário Base', CurrencyFormatter.format(r.salarioBruto)],
		['Periculosidade', CurrencyFormatter.format(r.periculosidade)],
		['Insalubridade', CurrencyFormatter.format(r.insalubridade)],
		['Horas Extras (50%)', CurrencyFormatter.format(r.valorHorasExtras)],
		['Adicional Noturno (20%)', CurrencyFormatter.format(r.adicionalNoturno)],
		['Bruto', CurrencyFormatter.format(r.bruto)]
	];
	const sec2 = [
		['INSS', CurrencyFormatter.format(r.inss)],
		['Base IRRF', CurrencyFormatter.format(r.baseIRRF)],
		['IRRF', CurrencyFormatter.format(r.irrf)],
		['VT', CurrencyFormatter.format(r.descontoVt)],
		['VR', CurrencyFormatter.format(r.descontoVr)],
		['Saúde', CurrencyFormatter.format(r.descontoSaude)],
		['Adiantamentos', CurrencyFormatter.format(r.descontoAdiantamentos)],
		['Total Descontos', CurrencyFormatter.format(r.totalDescontos)]
	];
	const sec3 = [
		['Salário Família', CurrencyFormatter.format(r.salarioFamilia)],
		['Líquido', CurrencyFormatter.format(r.liquido)]
	];
	const row = x=>`<div class="row-pair"><span>${x[0]}</span><span class="valor-monetario">${x[1]}</span></div>`;
	const inssTable = (r.inssBreakdown||[]).map(f=>`<tr><td class="pr-3">${f.faixa}</td><td class="pr-2">${(f.aliquota*100).toFixed(1)}%</td><td>${CurrencyFormatter.format(f.parcela)}</td></tr>`).join('');
	const irrfFaixa = r.irrfFaixa ? `<p class="text-xs mt-2">Faixa IRRF: até ${r.irrfFaixa.limit===Infinity?'∞':CurrencyFormatter.format(r.irrfFaixa.limit)} | Alíquota ${(r.irrfFaixa.rate*100).toFixed(1)}% | Dedução ${CurrencyFormatter.format(r.irrfFaixa.deduction)}</p>` : '';
	const breakdown = `<details class="mt-3 group"><summary class="cursor-pointer text-xs text-primary hover:underline">Ver detalhes de faixas</summary><div class="mt-2 rounded border p-2 bg-subtle overflow-auto"><h4 class="text-xs font-semibold mb-1">INSS</h4><table class="text-[11px]"><thead><tr><th class="text-left pr-3">Faixa</th><th class="text-left pr-2">Alíq.</th><th class="text-left">Parcela</th></tr></thead><tbody>${inssTable}</tbody></table>${irrfFaixa}<p class="text-[10px] mt-2 text-muted-foreground">Modelo mensal simplificado.</p></div></details>`;
	return `<div class="card-base p-4 space-y-3"><h2 class="text-lg font-semibold mb-1">Resultados (Salário Líquido)</h2><div class="space-y-3"><div class="section-block space-y-1">${sec1.map(row).join('')}</div><div class="section-block space-y-1">${sec2.map(row).join('')}</div><div class="section-block space-y-1">${sec3.map(row).join('')}${totalLine('Salário Líquido', CurrencyFormatter.format(r.liquido))}</div></div>${breakdown}</div>`;
}

// Nomes em PT-BR (mantendo compatibilidade)
export const renderizarResultadosFerias = renderFeriasResults;
export const renderizarResultadosDecimoTerceiro = renderDecimoTerceiroResults;
export const renderizarResultadosRescisao = renderRescisaoResults;
export const renderizarResultadosFGTS = renderFGTSResults;
export const renderizarResultadosPISPASEP = renderPISPASEPResults;
export const renderizarResultadosSeguroDesemprego = renderSeguroDesempregoResults;
export const renderizarResultadosHorasExtras = renderHorasExtrasResults;
export const renderizarResultadosCalculadoraINSS = renderINSSCalculatorResults;
export const renderizarResultadosValeTransporte = renderValeTransporteResults;
export const renderizarResultadosIRPF = renderIRPFResults;
export const renderizarResultadosSalarioLiquido = renderSalarioLiquidoResults;
