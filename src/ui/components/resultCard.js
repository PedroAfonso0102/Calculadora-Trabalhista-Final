// Componente de UI: resultCard
import { CurrencyFormatter } from '../../services/formatter.js';
import { getAnoAtual } from '../../core/parametersStore.js';

function emptyState(label){
	return `<div class="rounded-lg border p-6 bg-card text-card-foreground shadow-sm empty-state">
		<div class="icon mb-2">💡</div>
		<p>Preencha os campos para iniciar o cálculo de <strong>${label}</strong>.</p>
	</div>`;
}

function loadingSkeleton(rows = 6){
  const sk = Array.from({length:rows}).map(()=>'<div class="h-4 w-full skeleton"></div>').join('<div class="h-2"></div>');
  return `<div class="space-y-3">${sk}</div>`;
}

function money(v){ return `<span class="valor-monetario">${v}</span>`; }

function totalLine(label, value){
  return `<div class="flex justify-between items-center pt-1 border-t mt-2"><span class="text-xs md:text-sm font-medium tracking-tight">${label}</span><span class="totalizador valor-monetario">${value}</span></div>`;
}
/**
 * Result Cards
 *
 * Funções puras que recebem resultados (ou estado) e retornam HTML.
 */

/**
 * Renderiza os resultados de férias.
 * @param {Object} results - Objeto de resultados (placeholder por enquanto).
 * @returns {string} HTML
 */
export function renderFeriasResults(results) {
	if (!results || Object.keys(results).length === 0) {
		return `<div class="rounded-lg border p-4 bg-card shadow-sm">
		<h2 class="text-lg font-semibold mb-3 flex items-center gap-2">Resultados (Férias)</h2>
		${emptyState('Férias')}
	</div>`;
	}

	const sec1 = [
		{ label: 'Dias de Férias', value: results.diasFerias },
		{ label: 'Salário Base', value: CurrencyFormatter.format(results.salarioBruto) },
		{ label: 'Médias (Extras+Noturno)', value: CurrencyFormatter.format(results.mediaHorasExtras + results.mediaAdicionalNoturno) },
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
		{ label: 'Total Cash-in', value: CurrencyFormatter.format(results.liquidoComTudo) }
	];

	function renderRows(rows){
		return rows.map(r => `<div class=\"row-pair\"><span>${r.label}</span><span class=\"valor-monetario\">${r.value}</span></div>`).join('');
	}

	const rowsHTML = `
		<div class=\"section-block space-y-1\">${renderRows(sec1)}</div>
		<div class=\"section-block space-y-1\">${renderRows(sec2)}</div>
		<div class=\"section-block space-y-1\">${renderRows(sec3)}</div>
		<div class=\"section-block space-y-1\">${renderRows(sec4)}${totalLine('Total Cash-in', sec4[2].value)}</div>
	`;

	let warningsHTML = '';
	if (results.warnings && results.warnings.length) {
		warningsHTML = `<div class="mt-3 rounded-md border border-amber-300 bg-amber-50 p-2">
			<ul class="space-y-1 text-xs text-amber-800">${results.warnings.map(w => `<li>⚠ ${w}</li>`).join('')}</ul>
		</div>`;
	}

	// Breakdown detalhado
	let breakdownHTML = '';
	if (results.inssBreakdown || results.irrfFaixa) {
		const inssTable = (results.inssBreakdown || []).map(f => `<tr><td class=\"pr-4\">${f.faixa}</td><td class=\"pr-2\">${(f.aliquota*100).toFixed(1)}%</td><td>${CurrencyFormatter.format(f.parcela)}</td></tr>`).join('');
		const irrfFaixa = results.irrfFaixa ? `<p class=\"text-xs mt-2\">Faixa IRRF: até ${results.irrfFaixa.limit === Infinity ? '∞' : CurrencyFormatter.format(results.irrfFaixa.limit)} | Alíquota ${(results.irrfFaixa.rate*100).toFixed(1)}% | Dedução ${CurrencyFormatter.format(results.irrfFaixa.deduction)}</p>` : '';
		breakdownHTML = `<details class=\"mt-3 group\"><summary class=\"cursor-pointer text-xs text-primary hover:underline\">Ver detalhes de faixas</summary>
		<div class=\"mt-2 rounded border p-2 bg-gray-50 overflow-auto\">
			<h4 class=\"text-xs font-semibold mb-1\">INSS</h4>
			<table class=\"text-[11px]\"><thead><tr><th class=\"text-left pr-4\">Faixa</th><th class=\"text-left pr-2\">Alíquota</th><th class=\"text-left\">Parcela</th></tr></thead><tbody>${inssTable}</tbody></table>
			${irrfFaixa}
			<p class=\"text-[10px] mt-2 text-muted-foreground\">Modelo simplificado. Conferir legislações vigentes.</p>
		</div></details>`;
	}

	const ano = (()=>{ try { return getAnoAtual(); } catch(_e){ return ''; } })();
	return `<div class="rounded-lg border p-4 bg-card shadow-sm space-y-3">
		<h2 class="text-lg font-semibold mb-1 flex items-center gap-2">Resultados (Férias) ${ano?`<span class=\"text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/30\">${ano}</span>`:''}</h2>
		<div class="space-y-3">${rowsHTML}</div>
		${warningsHTML}
		${breakdownHTML}
		<p class="text-[11px] text-muted-foreground mt-3">* Bases segregadas: abono e 13º adiantado fora das incidências. [Modelo simplificado]</p>
	</div>`;
}

export function renderDecimoTerceiroResults(results) {
	if (!results || Object.keys(results).length === 0) {
		return `<div class="rounded-lg border p-4 bg-card shadow-sm">
		<h2 class="text-lg font-semibold mb-3">Resultados (13º)</h2>
		${emptyState('13º Salário')}
	</div>`;
	}

	const sec1 = [
		{ label: 'Meses Trabalhados', value: results.mesesTrabalhados },
		{ label: 'Salário Base', value: CurrencyFormatter.format(results.salarioBruto) },
		{ label: 'Médias', value: CurrencyFormatter.format(results.mediaHorasExtras + results.mediaAdicionalNoturno) },
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
	if (results.warnings && results.warnings.length) {
		warningsHTML = `<div class="mt-3 rounded-md border border-amber-300 bg-amber-50 p-2">
			<ul class="space-y-1 text-xs text-amber-800">${results.warnings.map(w => `<li>⚠ ${w}</li>`).join('')}</ul>
		</div>`;
	}

	let breakdownHTML = '';
	if (results.inssBreakdown || results.irrfFaixa) {
		const inssTable = (results.inssBreakdown || []).map(f => `<tr><td class=\"pr-4\">${f.faixa}</td><td class=\"pr-2\">${(f.aliquota*100).toFixed(1)}%</td><td>${CurrencyFormatter.format(f.parcela)}</td></tr>`).join('');
		const irrfFaixa = results.irrfFaixa ? `<p class=\"text-xs mt-2\">Faixa IRRF: até ${results.irrfFaixa.limit === Infinity ? '∞' : CurrencyFormatter.format(results.irrfFaixa.limit)} | Alíquota ${(results.irrfFaixa.rate*100).toFixed(1)}% | Dedução ${CurrencyFormatter.format(results.irrfFaixa.deduction)}</p>` : '';
		breakdownHTML = `<details class=\"mt-3 group\"><summary class=\"cursor-pointer text-xs text-primary hover:underline\">Ver detalhes de faixas</summary>
		<div class=\"mt-2 rounded border p-2 bg-gray-50 overflow-auto\">
			<h4 class=\"text-xs font-semibold mb-1\">INSS</h4>
			<table class=\"text-[11px]\"><thead><tr><th class=\"text-left pr-4\">Faixa</th><th class=\"text-left pr-2\">Alíquota</th><th class=\"text-left\">Parcela</th></tr></thead><tbody>${inssTable}</tbody></table>
			${irrfFaixa}
			<p class=\"text-[10px] mt-2 text-muted-foreground\">Modelo simplificado. Conferir legislações vigentes.</p>
		</div></details>`;
	}

	const ano = (()=>{ try { return getAnoAtual(); } catch(_e){ return ''; } })();
	return `<div class=\"rounded-lg border p-4 bg-card shadow-sm space-y-3\">
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

export function renderRescisaoResults(results){
	if (!results || Object.keys(results).length === 0){
		return `<div class="rounded-lg border p-4 bg-card shadow-sm">
			<h2 class="text-lg font-semibold mb-3">Resultados (Rescisão)</h2>
			${emptyState('Rescisão')}
		</div>`;
	}

	const sec1 = [
		{ label: 'Motivo', value: results.motivo },
		{ label: 'Anos (aprox.)', value: results.anosEstimados },
		{ label: 'Dias Aviso', value: results.diasAviso },
		{ label: 'Remuneração Base', value: CurrencyFormatter.format(results.remuneracaoBase) }
	];
	const sec2 = [
		{ label: 'Saldo Salário', value: CurrencyFormatter.format(results.saldoSalario) },
		{ label: 'Aviso Indenizado', value: CurrencyFormatter.format(results.avisoIndenizado) },
		{ label: 'Férias Vencidas', value: CurrencyFormatter.format(results.feriasVencidas) },
		{ label: 'Férias Proporcionais', value: CurrencyFormatter.format(results.feriasProporcionais) },
		{ label: '13º Proporcional', value: CurrencyFormatter.format(results.decimoProporcional) },
		{ label: 'Multa FGTS', value: CurrencyFormatter.format(results.multaFGTS) }
	];
		const sec3 = [
		{ label: 'Total Bruto', value: CurrencyFormatter.format(results.totalBruto) },
		{ label: 'INSS (simpl.)', value: CurrencyFormatter.format(results.inss) },
		{ label: 'Base IRRF', value: CurrencyFormatter.format(results.baseIRRF) },
		{ label: 'IRRF (simpl.)', value: CurrencyFormatter.format(results.irrf) },
		{ label: 'Total Descontos', value: CurrencyFormatter.format(results.totalDescontos) },
		{ label: 'Total Líquido Est.', value: CurrencyFormatter.format(results.totalLiquidoEstimado) }
	];

		const fgtsComp = (results.fgtsReflex?.componentes||[]).map(c => `<tr><td class=\"pr-4\">${c.label}</td><td class=\"pr-4\">${CurrencyFormatter.format(c.base)}</td><td>${CurrencyFormatter.format(c.fgts)}</td></tr>`).join('');
		const fgtsSection = results.fgtsReflex ? `<details class=\"mt-3 group\"><summary class=\"cursor-pointer text-xs text-primary hover:underline\">Ver reflexos de FGTS</summary><div class=\"mt-2 rounded border p-2 bg-gray-50 overflow-auto\"><h4 class=\"text-xs font-semibold mb-2\">Depósitos Simulados (8%)</h4><table class=\"text-[11px]\"><thead><tr><th class=\"text-left pr-4\">Componente</th><th class=\"text-left pr-4\">Base</th><th class=\"text-left\">FGTS</th></tr></thead><tbody>${fgtsComp}</tbody></table><p class=\"text-[11px] mt-2\">FGTS Reflex Total: <strong>${CurrencyFormatter.format(results.fgtsReflex.total)}</strong></p><p class=\"text-[11px]\">Base Multa FGTS (Saldo + Reflexos): <strong>${CurrencyFormatter.format(results.fgtsReflex.baseMultaFGTS)}</strong></p></div></details>` : '';

	function rows(list){
		return list.map(r => `<div class=\"row-pair\"><span>${r.label}</span><span class=\"valor-monetario\">${r.value}</span></div>`).join('');
	}

	// Donut Chart: proporção de componentes brutos (saldo, aviso, férias vencidas, férias prop, 13º, multa FGTS)
	const partes = [
		{ key:'saldoSalario', label:'Saldo Sal.', valor: results.saldoSalario, color:'#3b82f6' },
		{ key:'avisoIndenizado', label:'Aviso', valor: results.avisoIndenizado, color:'#6366f1' },
		{ key:'feriasVencidas', label:'Férias Venc.', valor: results.feriasVencidas, color:'#10b981' },
		{ key:'feriasProporcionais', label:'Férias Prop.', valor: results.feriasProporcionais, color:'#f59e0b' },
		{ key:'decimoProporcional', label:'13º Prop.', valor: results.decimoProporcional, color:'#ec4899' },
		{ key:'multaFGTS', label:'Multa FGTS', valor: results.multaFGTS, color:'#ef4444' }
	].filter(p=>p.valor>0);
	const totalBruto = partes.reduce((a,b)=>a+b.valor,0) || 1;
	let acc = 0;
	const circles = partes.map(p=>{
		const frac = p.valor/totalBruto;
		const r = 16; const circ = 2*Math.PI*r;
		const dash = (frac*circ).toFixed(2);
		const gap = (circ - frac*circ).toFixed(2);
		const rotate = (acc/totalBruto)*360; acc += p.valor;
		return `<circle r="16" cx="20" cy="20" stroke="${p.color}" stroke-width="8" fill="transparent" stroke-dasharray="${dash} ${gap}" transform="rotate(${rotate} 20 20)" />`;
	}).join('');
	const donut = `<div class=\"donut-chart\"><svg viewBox=\"0 0 40 40\">${circles}<circle r=\"10\" cx=\"20\" cy=\"20\" fill=\"hsl(var(--background))\"/></svg></div>`;
	const legend = `<div class=\"mt-2 space-y-1\">${partes.map(p=>`<div class=\"donut-legend-item\"><span><span class=\"donut-legend-color\" style=\"background:${p.color}\"></span>${p.label}</span><span class=\"valor-monetario\">${CurrencyFormatter.format(p.valor)}</span></div>`).join('')}</div>`;

	let warningsHTML = '';
	if (results.warnings && results.warnings.length){
		warningsHTML = `<div class=\"mt-3 rounded-md border border-amber-300 bg-amber-50 p-2\"><ul class=\"space-y-1 text-xs text-amber-800\">${results.warnings.map(w => `<li>⚠ ${w}</li>`).join('')}</ul></div>`;
	}

	// Notas informativas (diferente de warnings: indicam opções avançadas aplicadas)
	let notesHTML = '';
	try {
		const notes = [];
		(results.warnings||[]).forEach(w => {
			if (w.toLowerCase().includes('projeção de aviso aplicada')) {
				notes.push('Projeção do aviso considerada para contagem de avos (13º e férias).');
			}
			if (w.toLowerCase().includes('férias vencidas excluídas')) {
				notes.push('Férias vencidas excluídas da base da multa de FGTS.');
			}
			if (w.toLowerCase().includes('redução de 7 dias aplicada')) {
				notes.push('Redução legal de 7 dias aplicada ao aviso trabalhado (simplificação).');
			}
		});
		// Eliminar duplicadas
		const uniq = [...new Set(notes)];
		if (uniq.length){
			notesHTML = `<div class=\"mt-3 rounded-md border border-sky-300 bg-sky-50 p-2\"><ul class=\"space-y-1 text-xs text-sky-800\">${uniq.map(n => `<li>ℹ ${n}</li>`).join('')}</ul></div>`;
		}
	} catch(e){ /* noop */ }

	let breakdownHTML = '';
	if (results.inssBreakdown || results.irrfFaixa){
		const inssFolha = (results.inssBreakdown||[]).filter(f=>f.tipo==='folha');
		const inss13 = (results.inssBreakdown||[]).filter(f=>f.tipo==='13o');
		const tableFolha = inssFolha.length ? `<div class=\"mb-2\"><p class=\"text-[11px] font-semibold mb-1\">INSS Folha (Base: ${CurrencyFormatter.format(results.baseINSSFolha||0)})</p><table class=\"text-[11px] mb-1\"><thead><tr><th class=\"text-left pr-3\">Faixa</th><th class=\"text-left pr-2\">Alíq.</th><th class=\"text-left\">Parcela</th></tr></thead><tbody>${inssFolha.map(f=>`<tr><td class=\"pr-3\">${f.faixa}</td><td class=\"pr-2\">${(f.aliquota*100).toFixed(1)}%</td><td>${CurrencyFormatter.format(f.parcela)}</td></tr>`).join('')}</tbody></table></div>` : '';
		const table13 = inss13.length ? `<div><p class=\"text-[11px] font-semibold mb-1\">INSS 13º (Base: ${CurrencyFormatter.format(results.baseINSSDecimo||0)})</p><table class=\"text-[11px]\"><thead><tr><th class=\"text-left pr-3\">Faixa</th><th class=\"text-left pr-2\">Alíq.</th><th class=\"text-left\">Parcela</th></tr></thead><tbody>${inss13.map(f=>`<tr><td class=\"pr-3\">${f.faixa}</td><td class=\"pr-2\">${(f.aliquota*100).toFixed(1)}%</td><td>${CurrencyFormatter.format(f.parcela)}</td></tr>`).join('')}</tbody></table></div>` : '';
		const irrfFaixa = results.irrfFaixa ? `<p class=\"text-xs mt-3\">Faixa IRRF: até ${results.irrfFaixa.limit===Infinity ? '∞' : CurrencyFormatter.format(results.irrfFaixa.limit)} | Alíquota ${(results.irrfFaixa.rate*100).toFixed(1)}% | Dedução ${CurrencyFormatter.format(results.irrfFaixa.deduction)}</p>` : '';
		breakdownHTML = `<details class=\"mt-3 group\"><summary class=\"cursor-pointer text-xs text-primary hover:underline\">Ver detalhes de bases e faixas</summary><div class=\"mt-2 rounded border p-2 bg-gray-50 overflow-auto\">${tableFolha}${table13}${irrfFaixa}<p class=\"text-[10px] mt-2 text-muted-foreground\">INSS segmentado (folha vs 13º) exibido de forma simplificada.</p></div></details>`;
	}

	const ano = (()=>{ try { return getAnoAtual(); } catch(_e){ return ''; } })();
	return `<div class=\"rounded-lg border p-4 bg-card shadow-sm space-y-3\">
		<h2 class=\"text-lg font-semibold mb-1 flex items-center gap-2\">Resultados (Rescisão) ${ano?`<span class=\\"text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/30\\">${ano}</span>`:''}</h2>
		<div class=\"space-y-3\">
			<div class=\"section-block space-y-1\">${rows(sec1)}</div>
			<div class=\"section-block space-y-1\">${rows(sec2)}</div>
			<div class=\"section-block space-y-1\">${rows(sec3)}${totalLine('Total Líquido', sec3[5].value)}</div>
		</div>
		<div class=\"mt-2 grid md:grid-cols-2 gap-4\">${donut}${legend}</div>
			${warningsHTML}
			${fgtsSection}
		${notesHTML}
		${breakdownHTML}
		<p class=\"text-[11px] text-muted-foreground mt-3\">* Modelo simplificado: não inclui todas as verbas possíveis, reflexos ou particularidades de CCT/ACT.</p>
	</div>`;
}

// ===== Novas calculadoras =====
function genericEmpty(label){
	return `<div class="rounded-lg border p-4 bg-card shadow-sm"><h2 class="text-lg font-semibold mb-3">Resultados (${label})</h2>${emptyState(label)}</div>`;
}

export function renderFGTSResults(r){
	if (!r || Object.keys(r).length===0) return genericEmpty('FGTS');
	const rows = [
		['Meses', r.meses],
		['Base Mensal', CurrencyFormatter.format(r.baseMensal)],
		['Total Base', CurrencyFormatter.format(r.totalBase)],
		['Alíquota', (r.aliquota*100).toFixed(2)+'%'],
		['Depósitos', CurrencyFormatter.format(r.deposito)],
		['Distribuição', CurrencyFormatter.format(r.distribuicaoLucros)],
		['Total Ano', CurrencyFormatter.format(r.totalAno)]
	].map(x=>`<div class="row-pair"><span>${x[0]}</span><span class="valor-monetario">${x[1]}</span></div>`).join('');
	return `<div class="rounded-lg border p-4 bg-card shadow-sm"><h2 class="text-lg font-semibold mb-3">Resultados (FGTS)</h2><div class="space-y-1">${rows}</div>${totalLine('Total Ano', CurrencyFormatter.format(r.totalAno))}</div>`;
}

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
	return `<div class="rounded-lg border p-4 bg-card shadow-sm"><h2 class="text-lg font-semibold mb-3">Resultados (PIS/PASEP)</h2><div class="space-y-1">${rows}</div>${totalLine('Valor Proporcional', CurrencyFormatter.format(r.valorProporcional))}</div>`;
}

export function renderSeguroDesempregoResults(r){
	if (!r || Object.keys(r).length===0) return genericEmpty('Seguro-Desemprego');
	const rows = [
		['Meses (36)', r.meses],
		['Média Salarial', CurrencyFormatter.format(r.media)],
		['Solicitações', r.solicitacoes],
		['Parcela', CurrencyFormatter.format(r.parcela)],
		['Qtd Parcelas', r.parcelas],
		['Total', CurrencyFormatter.format(r.total)]
	].map(x=>`<div class="row-pair"><span>${x[0]}</span><span class="valor-monetario">${x[1]}</span></div>`).join('');
	return `<div class="rounded-lg border p-4 bg-card shadow-sm"><h2 class="text-lg font-semibold mb-3">Resultados (Seguro-Desemprego)</h2><div class="space-y-1">${rows}</div>${totalLine('Total Benefício', CurrencyFormatter.format(r.total))}<p class="text-[11px] text-muted-foreground mt-2">Modelo simplificado de cálculo para estimativa.</p></div>`;
}

export function renderHorasExtrasResults(r){
	if (!r || Object.keys(r).length===0) return genericEmpty('Horas Extras');
	const rows = [
		['Carga Horária', r.carga],
		['Valor Hora', CurrencyFormatter.format(r.valorHora)],
		['Horas Extras', r.horasExtras],
		['Adicional (%)', r.adicionalPercent.toFixed(2)+'%'],
		['Valor Horas Extras', CurrencyFormatter.format(r.valorHoras)]
	].map(x=>`<div class="row-pair"><span>${x[0]}</span><span class="valor-monetario">${x[1]}</span></div>`).join('');
	return `<div class="rounded-lg border p-4 bg-card shadow-sm"><h2 class="text-lg font-semibold mb-3">Resultados (Horas Extras)</h2><div class="space-y-1">${rows}</div>${totalLine('Valor Extras', CurrencyFormatter.format(r.valorHoras))}</div>`;
}

export function renderINSSCalculatorResults(r){
	if (!r || Object.keys(r).length===0) return genericEmpty('INSS');
	const faixas = (r.faixas||[]).map(f=>`<tr><td class="pr-3">${f.faixa}</td><td class="pr-2">${(f.aliquota*100).toFixed(1)}%</td><td>${CurrencyFormatter.format(f.parcela)}</td></tr>`).join('');
	return `<div class="rounded-lg border p-4 bg-card shadow-sm space-y-3"><h2 class="text-lg font-semibold mb-1">Resultados (INSS)</h2><div class="space-y-1"><div class="row-pair"><span>Salário</span><span class="valor-monetario">${CurrencyFormatter.format(r.salario)}</span></div><div class="row-pair"><span>Contribuição</span><span class="valor-monetario">${CurrencyFormatter.format(r.contribuicao)}</span></div>${totalLine('Total', CurrencyFormatter.format(r.contribuicao))}</div><details class="group"><summary class="cursor-pointer text-xs text-primary hover:underline">Detalhamento Faixas</summary><div class="mt-2 overflow-auto rounded border p-2 bg-gray-50"><table class="text-[11px]"><thead><tr><th class="text-left pr-3">Faixa</th><th class="text-left pr-2">Alíq.</th><th class="text-left">Parcela</th></tr></thead><tbody>${faixas}</tbody></table></div></details></div>`;
}

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
	return `<div class="rounded-lg border p-4 bg-card shadow-sm"><h2 class="text-lg font-semibold mb-3">Resultados (Vale-Transporte)</h2><div class="space-y-1">${rows}</div>${totalLine('Custo Total', CurrencyFormatter.format(r.custoTotal))}</div>`;
}

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
	return `<div class="rounded-lg border p-4 bg-card shadow-sm"><h2 class="text-lg font-semibold mb-3">Resultados (IRPF)</h2><div class="space-y-1">${rows}</div>${totalLine('Imposto Anual', CurrencyFormatter.format(r.impostoAnual))}${faixa}<p class="text-[11px] text-muted-foreground mt-2">Modelo estimativo. Não substitui cálculo oficial da DIRPF.</p></div>`;
}


