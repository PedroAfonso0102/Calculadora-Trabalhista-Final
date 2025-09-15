// Funções de UI específicas do FAQ.
/**
 * Knowledge Base - UI Module
 *
 * This module handles all DOM manipulation and rendering logic
 * specifically for the knowledge base and FAQ modal feature.
 */

import {
    loadKnowledgeBase,
    getAllFaqCategories,
    getFaqCategory,
    searchKnowledgeBase
} from './knowledge.js';

let activeFaqCategory = null;

/**
 * Creates and appends the FAQ modal to the DOM if it doesn't exist.
 */
function ensureFaqModalExists() {
    if (document.getElementById('faq-modal')) return;

    const modalHTML = `
      <div id="faq-modal-overlay" class="fixed inset-0 bg-black/50 z-40 opacity-0 transition-opacity duration-300 hidden"></div>
      <div id="faq-modal" class="fixed inset-y-0 right-0 w-full max-w-2xl bg-white z-50 shadow-2xl transform translate-x-full transition-transform duration-300 flex flex-col" role="dialog" aria-modal="true" aria-labelledby="faq-modal-title">
        <!-- Header -->
        <header class="flex items-center justify-between p-4 border-b">
          <h2 id="faq-modal-title" class="text-lg font-semibold flex items-center">
            <span class="material-icons-outlined mr-2 text-primary">quiz</span>
            Base de Conhecimento
          </h2>
          <button id="faq-modal-close-btn" class="p-1 rounded-full hover:bg-gray-100" aria-label="Fechar">
            <span class="material-icons-outlined">close</span>
          </button>
        </header>
        <!-- Search -->
        <div class="p-4 border-b">
          <div class="relative">
            <span class="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
            <input type="text" id="faq-search-input" placeholder="Buscar por termos..." class="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:outline-none">
          </div>
        </div>
        <!-- Content -->
        <div id="faq-content-area" class="flex-1 overflow-y-auto p-6">
          <!-- Content is rendered here -->
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Attach event listeners once
    document.getElementById('faq-modal-close-btn').addEventListener('click', closeFaqModal);
    document.getElementById('faq-modal-overlay').addEventListener('click', closeFaqModal);
    document.getElementById('faq-search-input').addEventListener('input', (e) => renderFaqContent(e.target.value));
}

/**
 * Renders the content of the FAQ modal, either categories or search results.
 * @param {string} [searchQuery=""] - An optional search query.
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
 * Renders the list of FAQ categories.
 * @param {Array} categories - The array of category objects.
 * @returns {string} The HTML string for the category list.
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
 * Renders the search results.
 * @param {Array} results - The array of search result objects.
 * @returns {string} The HTML string for the search results.
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
 * Renders the questions for a specific category inside the modal.
 * @param {string} categoryId - The ID of the category to display.
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
 * Attaches event listeners to the dynamic content within the FAQ modal.
 */
function attachContentListeners() {
    // Listeners for category clicks
    document.querySelectorAll('.faq-category-item').forEach(btn => {
        btn.addEventListener('click', () => renderQuestionList(btn.dataset.categoryId));
    });

    // Listener for the back button
    const backBtn = document.getElementById('faq-back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => renderFaqContent());
    }

    // Listeners for accordion (questions)
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
 * Opens and displays the FAQ modal.
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
 * Closes and hides the FAQ modal.
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
