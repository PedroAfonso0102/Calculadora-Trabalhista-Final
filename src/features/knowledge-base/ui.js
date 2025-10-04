/**
 * @file Módulo de UI para a Base de Conhecimento.
 * @module features/knowledge-base/ui
 * @description Gerencia toda a manipulação do DOM e a lógica de renderização
 * para a funcionalidade do modal de FAQ (Base de Conhecimento), incluindo a
 * exibição de categorias, perguntas/respostas e resultados de busca.
 */

import {
    loadKnowledgeBase,
    getAllFaqCategories,
    getFaqCategory,
    searchKnowledgeBase
} from './knowledge.js';

/**
 * Armazena a categoria de FAQ atualmente ativa para referência.
 * @private
 * @type {object|null}
 */
let activeFaqCategory = null;

/**
 * Cria e anexa a estrutura HTML do modal de FAQ ao DOM, se ela ainda não existir.
 * Anexa também os ouvintes de eventos estáticos (fechar, overlay, busca, tecla Esc)
 * de forma idempotente.
 * @private
 */
function ensureFaqModalExists() {
    if (document.getElementById('faq-modal')) return;

    const modalHTML = `
      <div id="faq-modal-overlay" class="fixed inset-0 bg-black/50 z-40 opacity-0 transition-opacity duration-300 hidden"></div>
      <div id="faq-modal" class="fixed inset-y-0 right-0 w-full max-w-2xl bg-white z-50 shadow-2xl transform translate-x-full transition-transform duration-300 flex flex-col" role="dialog" aria-modal="true" aria-labelledby="faq-modal-title">
        <header class="flex items-center justify-between p-4 border-b">
          <h2 id="faq-modal-title" class="text-lg font-semibold flex items-center">
            <span class="material-icons-outlined mr-2 text-primary">quiz</span>
            Base de Conhecimento
          </h2>
          <button id="faq-modal-close-btn" class="p-1 rounded-full hover:bg-gray-100" aria-label="Fechar">
            <span class="material-icons-outlined">close</span>
          </button>
        </header>
        <div class="p-4 border-b">
          <div class="relative">
            <span class="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
            <input type="text" id="faq-search-input" placeholder="Buscar por termos..." class="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:outline-none">
          </div>
        </div>
        <div id="faq-content-area" class="flex-1 overflow-y-auto p-6"></div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    document.getElementById('faq-modal-close-btn').addEventListener('click', closeFaqModal);
    document.getElementById('faq-modal-overlay').addEventListener('click', closeFaqModal);
    document.getElementById('faq-search-input').addEventListener('input', (e) => renderFaqContent(e.target.value));
    document.addEventListener('keydown', (ev)=>{
        if (ev.key === 'Escape') closeFaqModal();
    });
}

/**
 * Renderiza o conteúdo principal do modal de FAQ. Se uma `searchQuery` for fornecida,
 * exibe os resultados da busca. Caso contrário, exibe a lista de categorias de FAQ.
 * @private
 * @async
 * @param {string} [searchQuery=""] - O termo de busca opcional inserido pelo usuário.
 */
async function renderFaqContent(searchQuery = "") {
    await loadKnowledgeBase();
    const contentArea = document.getElementById('faq-content-area');
    if (!contentArea) return;

    let items;
    let html = '';

    if (searchQuery.length > 1) {
        items = searchKnowledgeBase(searchQuery);
        html = renderSearchResults(items);
    } else {
        items = getAllFaqCategories();
        html = renderCategoryList(items);
    }
    contentArea.innerHTML = html;
    attachContentListeners();
}

/**
 * Gera a string HTML para a lista de categorias de FAQ.
 * @private
 * @param {Array<object>} categories - Um array de objetos de categoria, cada um com `id`, `title` e `questions`.
 * @returns {string} A string HTML representando a lista de categorias.
 */
function renderCategoryList(categories) {
    if (!categories.length) return `<p>Nenhuma categoria encontrada.</p>`;
    return `
      <div class="space-y-3">
        ${categories.map(cat => `
          <button data-category-id="${cat.id}" class="faq-category-item w-full text-left p-4 border rounded-lg hover:bg-gray-50 hover:border-primary transition flex justify-between items-center">
            <div>
              <h3 class="font-semibold text-primary">${cat.title}</h3>
              <p class="text-sm text-gray-600">${cat.questions?.length || 0} perguntas</p>
            </div>
            <span class="material-icons-outlined text-gray-400">chevron_right</span>
          </button>
        `).join('')}
      </div>
    `;
}

/**
 * Gera a string HTML para a lista de resultados de uma busca.
 * @private
 * @param {Array<object>} results - Um array de objetos de resultado da busca.
 * @returns {string} A string HTML representando os resultados da busca.
 */
function renderSearchResults(results) {
    if (!results.length) return `<p>Nenhum resultado encontrado.</p>`;
    return `
      <div class="space-y-4">
        <h3 class="text-md font-semibold mb-2">Resultados da Busca:</h3>
        ${results.map(item => `
          <div class="p-4 border rounded-lg">
            <h4 class="font-semibold">${item.type === 'faq' ? item.question : item.title}</h4>
            <div class="text-sm text-gray-700 mt-2 prose prose-sm max-w-none">${item.type === 'faq' ? item.answer : item.content}</div>
            <p class="text-xs text-gray-500 mt-3">Categoria: ${item.categoryTitle || 'Tooltip'}</p>
          </div>
        `).join('')}
      </div>
    `;
}

/**
 * Renderiza a lista de perguntas e respostas para uma categoria de FAQ específica em formato de acordeão.
 * @private
 * @param {string} categoryId - O ID da categoria a ser exibida.
 */
function renderQuestionList(categoryId) {
    const category = getFaqCategory(categoryId);
    if (!category) return;
    activeFaqCategory = category;

    const contentArea = document.getElementById('faq-content-area');
    const html = `
      <div class="space-y-4">
        <button id="faq-back-btn" class="flex items-center text-sm text-primary hover:underline mb-4">
          <span class="material-icons-outlined text-base mr-1">arrow_back</span>
          Voltar para Categorias
        </button>
        <h2 class="text-xl font-bold border-b pb-2">${category.title}</h2>
        <div id="faq-accordion" class="space-y-2">
          ${category.questions.map((q, index) => `
            <div class="border rounded-md">
              <button data-question-index="${index}" class="faq-question-toggle w-full flex justify-between items-center p-4 text-left">
                <span class="font-medium">${q.question}</span>
                <span class="material-icons-outlined transition-transform">expand_more</span>
              </button>
              <div class="faq-answer-content hidden p-4 pt-0 text-gray-700 prose prose-sm max-w-none">
                ${q.answer}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    contentArea.innerHTML = html;
    attachContentListeners();
}

/**
 * Anexa ouvintes de eventos ao conteúdo dinâmico do modal de FAQ.
 * Esta função é chamada sempre que o conteúdo do modal é recriado para garantir
 * que os botões de categoria, o botão de voltar e os itens do acordeão sejam interativos.
 * @private
 */
function attachContentListeners() {
    document.querySelectorAll('.faq-category-item').forEach(btn => {
        btn.addEventListener('click', () => renderQuestionList(btn.dataset.categoryId));
    });

    const backBtn = document.getElementById('faq-back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => renderFaqContent());
    }

    document.querySelectorAll('.faq-question-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const content = btn.nextElementSibling;
            const icon = btn.querySelector('.material-icons-outlined');
            const isOpen = !content.classList.contains('hidden');

            content.classList.toggle('hidden');
            icon.style.transform = isOpen ? '' : 'rotate(180deg)';
        });
    });
}

/**
 * Abre e exibe o modal da Base de Conhecimento (FAQ).
 * Orquestra a criação do modal (se necessário), renderiza o conteúdo inicial
 * e exibe o modal com uma animação de transição.
 * @public
 */
export function openFaqModal() {
    ensureFaqModalExists();
    renderFaqContent();
    const modal = document.getElementById('faq-modal');
    const overlay = document.getElementById('faq-modal-overlay');

    overlay.classList.remove('hidden');
    setTimeout(() => {
        overlay.classList.remove('opacity-0');
        modal.classList.remove('translate-x-full');
    }, 10);
}

/**
 * Fecha e esconde o modal da Base de Conhecimento (FAQ) com uma animação de transição.
 * @public
 */
export function closeFaqModal() {
    const modal = document.getElementById('faq-modal');
    const overlay = document.getElementById('faq-modal-overlay');
    if (!modal) return;

    overlay.classList.add('opacity-0');
    modal.classList.add('translate-x-full');

    setTimeout(() => {
        overlay.classList.add('hidden');
    }, 300);
}

/**
 * Alias de `openFaqModal` em português.
 * @type {typeof openFaqModal}
 */
export const abrirModalFaq = openFaqModal;
/**
 * Alias de `closeFaqModal` em português.
 * @type {typeof closeFaqModal}
 */
export const fecharModalFaq = closeFaqModal;
