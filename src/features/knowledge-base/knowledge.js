/**
 * @file Lógica de Gerenciamento da Base de Conhecimento.
 * @module features/knowledge-base/knowledge
 * @description Este módulo é responsável por carregar, armazenar em cache, indexar e
 * consultar os dados da base de conhecimento da aplicação, que inclui FAQs e tooltips aprimorados.
 */

/**
 * Cache para armazenar os dados da base de conhecimento após o primeiro carregamento,
 * evitando requisições de rede repetidas.
 * @private
 * @type {object|null}
 */
let knowledgeBase = null;

/**
 * Cache para o índice de busca, que é uma estrutura de dados achatada e otimizada
 * para pesquisas rápidas de texto completo.
 * @private
 * @type {Array<object>|null}
 */
let searchIndex = null;

/**
 * Carrega a base de conhecimento a partir de um arquivo JSON estático.
 * Se os dados já estiverem em cache, retorna a versão em cache. Caso contrário,
 * faz a requisição, armazena os dados em cache e constrói o índice de busca.
 * @public
 * @async
 * @returns {Promise<object>} Uma promessa que resolve com o objeto da base de conhecimento. Em caso de falha, retorna uma estrutura de fallback vazia.
 */
export async function loadKnowledgeBase() {
    if (knowledgeBase) {
        return knowledgeBase;
    }

    try {
        const response = await fetch('./data/expanded_knowledge_base.json');
        if (!response.ok) {
            throw new Error(`Erro HTTP! status: ${response.status}`);
        }
        knowledgeBase = await response.json();
        buildSearchIndex();
        return knowledgeBase;
    } catch (error) {
        console.error('Falha ao carregar base de conhecimento:', error);
        // Fornece uma estrutura de fallback para evitar que a aplicação quebre.
        return { faq_global: { categories: [] }, enhanced_tooltips: {} };
    }
}

/**
 * Constrói um índice de busca em memória a partir dos dados carregados da base de conhecimento.
 * Este índice é uma lista "achatada" de todos os itens pesquisáveis (FAQs, tooltips),
 * com um campo `searchText` concatenado e em minúsculas para otimizar as buscas.
 * @private
 */
function buildSearchIndex() {
    if (!knowledgeBase) return;

    searchIndex = [];

    // Indexa as FAQs
    knowledgeBase.faq_global?.categories?.forEach(category => {
        category.questions?.forEach(question => {
            searchIndex.push({
                type: 'faq',
                category: category.id,
                categoryTitle: category.title,
                id: question.id,
                question: question.question,
                answer: question.answer,
                tags: question.tags || [],
                searchText: `${question.question} ${question.answer} ${(question.tags || []).join(' ')}`.toLowerCase()
            });
        });
    });

    // Indexa os tooltips aprimorados
    if (knowledgeBase.enhanced_tooltips) {
        Object.entries(knowledgeBase.enhanced_tooltips).forEach(([key, tooltip]) => {
            searchIndex.push({
                type: 'tooltip',
                id: key,
                title: tooltip.title,
                content: tooltip.content,
                searchText: `${tooltip.title} ${tooltip.content} ${(tooltip.quickTips || []).join(' ')}`.toLowerCase()
            });
        });
    }
}

/**
 * Pesquisa na base de conhecimento usando o índice de busca pré-construído.
 * A busca é case-insensitive e retorna todos os itens cujo `searchText` contenha a query.
 * @public
 * @param {string} query - O termo a ser buscado.
 * @returns {Array<object>} Um array de objetos representando os resultados da busca. Retorna um array vazio se não houver correspondências ou a query for vazia.
 */
export function searchKnowledgeBase(query) {
    if (!searchIndex || !query.trim()) {
        return [];
    }
    const searchTerm = query.toLowerCase().trim();
    return searchIndex.filter(item => item.searchText.includes(searchTerm));
}

/**
 * Recupera um objeto de categoria de FAQ específico pelo seu ID.
 * @public
 * @param {string} categoryId - O ID da categoria a ser recuperada.
 * @returns {object|null} O objeto da categoria correspondente ou `null` se não for encontrado.
 */
export function getFaqCategory(categoryId) {
    return knowledgeBase?.faq_global?.categories.find(cat => cat.id === categoryId) || null;
}

/**
 * Recupera todas as categorias de FAQ disponíveis na base de conhecimento.
 * @public
 * @returns {Array<object>} Um array com todos os objetos de categoria de FAQ.
 */
export function getAllFaqCategories() {
    return knowledgeBase?.faq_global?.categories || [];
}

/**
 * Recupera um objeto de tooltip aprimorado pela sua chave (ID).
 * @public
 * @param {string} topicKey - A chave (ID) do tópico do tooltip.
 * @returns {object|null} O objeto do tooltip correspondente ou `null` se não for encontrado.
 */
export function getEnhancedTooltip(topicKey) {
    return knowledgeBase?.enhanced_tooltips?.[topicKey] || null;
}
