/**
 * @file Serviço de Geração de PDF.
 * @module services/pdf
 * @description Este módulo fornece uma função utilitária para gerar relatórios em PDF
 * a partir dos resultados dos cálculos. Ele carrega dinamicamente as bibliotecas
 * `jsPDF` e `jspdf-autotable` de uma CDN para manter o build leve e sem dependências diretas.
 */

import { CurrencyFormatter } from './formatter.js';
import { getAnoAtual } from '../core/parametersStore.js';

/**
 * Promessa que armazena o estado de carregamento da biblioteca jsPDF para evitar cargas múltiplas.
 * @private
 * @type {Promise<Function>|null}
 */
let jspdfLoadingPromise = null;

/**
 * Promessa que armazena o estado de carregamento do plugin jsPDF-AutoTable.
 * @private
 * @type {Promise<boolean>|null}
 */
let autotableLoadingPromise = null;

/**
 * Carrega a biblioteca `jsPDF` dinamicamente de uma CDN, se ainda não estiver carregada.
 * Utiliza uma promessa para gerenciar o estado de carregamento e evitar requisições duplicadas.
 * @private
 * @returns {Promise<Function>} Uma promessa que resolve com a classe `jsPDF`.
 */
function getJsPDF() {
  if (typeof window !== 'undefined' && window.jspdf?.jsPDF) {
    return Promise.resolve(window.jspdf.jsPDF);
  }
  if (jspdfLoadingPromise) return jspdfLoadingPromise;
  jspdfLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
    script.async = true;
    script.onload = () => {
      try {
        const jsPDF = window.jspdf?.jsPDF;
        if (jsPDF) resolve(jsPDF);
        else reject(new Error('jsPDF UMD não disponível após o load.'));
      } catch (e) { reject(e); }
    };
    script.onerror = () => reject(new Error('Falha ao carregar jsPDF via CDN.'));
    document.head.appendChild(script);
  });
  return jspdfLoadingPromise;
}

/**
 * Carrega o plugin `jsPDF-AutoTable` dinamicamente de uma CDN, se ainda não estiver carregado.
 * @private
 * @returns {Promise<boolean>} Uma promessa que resolve como `true` quando o plugin é carregado com sucesso.
 */
function getAutoTable() {
  if (typeof window !== 'undefined' && window.jspdf?.jsPDF?.API?.autoTable) {
    return Promise.resolve(true);
  }
  if (autotableLoadingPromise) return autotableLoadingPromise;
  autotableLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.2/dist/jspdf.plugin.autotable.min.js';
    script.async = true;
    script.onload = () => {
      try {
        const ok = !!(window.jspdf?.jsPDF?.API?.autoTable);
        if (ok) resolve(true); else reject(new Error('AutoTable não disponível após o load.'));
      } catch (e) { reject(e); }
    };
    script.onerror = () => reject(new Error('Falha ao carregar jsPDF-AutoTable via CDN.'));
    document.head.appendChild(script);
  });
  return autotableLoadingPromise;
}

/**
 * @typedef {object} PdfSection
 * @property {string} title - O título da seção da tabela.
 * @property {Array<{label: string, value: any, format?: string}>} rows - As linhas de dados para a seção.
 */

/**
 * Gera e dispara o download de um arquivo PDF com os resultados de um cálculo.
 * O PDF é formatado com um cabeçalho, rodapé e tabelas estilizadas para cada seção de resultados.
 * @public
 * @async
 * @param {string} titulo - O título principal do relatório (ex: 'Cálculo de Férias').
 * @param {object} resultados - O objeto de resultados do cálculo (mantido para futuras expansões, atualmente não usado diretamente).
 * @param {Array<PdfSection|object>} sectionsOrLines - Um array de seções ou um array de linhas simples para gerar o conteúdo do PDF.
 * Se for um array de linhas, será agrupado sob um título "Resumo".
 */
export async function gerarPDFResultado(titulo, resultados, sectionsOrLines) {
  const jsPDF = await getJsPDF();
  await getAutoTable();

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  const left = 40; const right = 555; const top = 40; const bottom = 800;
  const appTitle = 'Calculadora Trabalhista';
  const calcTitle = String(titulo || 'Resultados');
  const now = new Date();
  let anoParam = '';
  try { anoParam = String(getAnoAtual() || ''); } catch(_e) {}

  const header = () => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(appTitle, left, top);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const rightText = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}${anoParam ? `  |  Parâmetros: ${anoParam}`:''}`;
    doc.text(rightText, right - doc.getTextWidth(rightText), top);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(calcTitle, left, top + 22);
  };

  const footer = () => {
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const txt = `Página ${i} de ${pageCount}`;
      doc.text(txt, right - doc.getTextWidth(txt), bottom + 20);
    }
  };

  header();

  let sections;
  if (Array.isArray(sectionsOrLines) && sectionsOrLines.length && sectionsOrLines[0]?.rows) {
    sections = sectionsOrLines;
  } else {
    sections = [{ title: 'Resumo', rows: sectionsOrLines || [] }];
  }

  let currentY = top + 40;
  const addSection = (sec) => {
    if (!sec || !Array.isArray(sec.rows) || sec.rows.length === 0) return;
    if (sec.title) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(String(sec.title), left, currentY);
      currentY += 14;
    }

    const head = [['Campo', 'Valor']];
    const body = sec.rows.map((r) => {
      const label = r?.label != null ? String(r.label) : '';
      let val = r?.value;
      if (r?.format === 'currency') {
        try { val = CurrencyFormatter.format(Number(val) || 0); } catch(_e) {}
      }
      const valStr = val != null ? String(val) : '-';
      return [label, valStr];
    });
    doc.autoTable({
      startY: currentY,
      margin: { left, right: 40 },
      head,
      body,
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 10, cellPadding: 6 },
      headStyles: { fillColor: [60, 64, 67], textColor: 255, fontStyle: 'bold' },
      bodyStyles: { textColor: 33 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) header();
      }
    });
    currentY = doc.lastAutoTable.finalY + 18;
    if (currentY > bottom - 60) {
      doc.addPage(); header(); currentY = top + 40;
    }
  };

  sections.forEach(addSection);
  footer();

  const filename = `${calcTitle.replace(/\s+/g, '_').toLowerCase()}_resultado.pdf`;
  doc.save(filename);
}
