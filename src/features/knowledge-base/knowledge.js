// Tudo relacionado à base de conhecimento.
/**
 * Knowledge Base - Data Logic
 *
 * This module manages the data layer for the knowledge base feature,
 * including loading the data from an external source, building a
 * search index, and providing functions to query the information.
 */

/**
 * Caches the knowledge base to avoid redundant network requests.
 * @type {object|null}
 */
let knowledgeBase = null;

/**
 * Caches the search index for quick lookups.
 * @type {Array|null}
 */
let searchIndex = null;

/**
 * Loads the expanded knowledge base from a JSON file.
 * @returns {Promise<object>} The loaded knowledge base.
 */
export async function loadKnowledgeBase() {
    if (knowledgeBase) {
        return knowledgeBase;
    }

    try {
        const response = await fetch('/data/expanded_knowledge_base.json'); // Adjusted path for root execution
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        knowledgeBase = await response.json();
        buildSearchIndex();
        return knowledgeBase;
    } catch (error) {
        console.error('Failed to load knowledge base:', error);
        // Provide a fallback structure to prevent application crashes
        return { faq_global: { categories: [] }, enhanced_tooltips: {} };
    }
}

/**
 * Builds a searchable index from the loaded knowledge base data.
 * @private
 */
function buildSearchIndex() {
    if (!knowledgeBase) return;

    searchIndex = [];

    // Index FAQs
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

    // Index enhanced tooltips
    if (knowledgeBase.enhanced_tooltips) {
        Object.entries(knowledgeBase.enhanced_tooltips).forEach(([key, tooltip]) => {
            searchIndex.push({
                type: 'tooltip',
                id: key,
                title: tooltip.title,
                content: tooltip.content,
                searchText: `${tooltip.title} ${tooltip.content} ${(tooltip.quick_tips || []).join(' ')}`.toLowerCase()
            });
        });
    }
}

/**
 * Searches the knowledge base using the pre-built index.
 * @param {string} query - The search term.
 * @returns {Array} An array of search results.
 */
export function searchKnowledgeBase(query) {
    if (!searchIndex || !query.trim()) {
        return [];
    }
    const searchTerm = query.toLowerCase().trim();
    return searchIndex.filter(item => item.searchText.includes(searchTerm));
}

/**
 * Retrieves a specific FAQ category by its ID.
 * @param {string} categoryId - The ID of the category.
 * @returns {object|null} The category object or null if not found.
 */
export function getFaqCategory(categoryId) {
    return knowledgeBase?.faq_global?.categories.find(cat => cat.id === categoryId) || null;
}

/**
 * Retrieves all FAQ categories.
 * @returns {Array} A list of all category objects.
 */
export function getAllFaqCategories() {
    return knowledgeBase?.faq_global?.categories || [];
}

/**
 * Retrieves an enhanced tooltip by its key.
 * @param {string} topicKey - The key of the tooltip topic.
 * @returns {object|null} The tooltip object or null if not found.
 */
export function getEnhancedTooltip(topicKey) {
    return knowledgeBase?.enhanced_tooltips?.[topicKey] || null;
}
