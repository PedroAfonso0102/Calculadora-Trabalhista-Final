/**
 * @file Módulo para o Modal de "Artigos Publicados".
 * @module features/content/articles
 * @description Gerencia a criação, carregamento de dados, e exibição do modal
 * que lista os artigos informativos relacionados a temas trabalhistas.
 */

/**
 * Carrega a lista de artigos a partir de um arquivo JSON estático.
 * Trata erros de `fetch` retornando uma lista vazia para não quebrar a aplicação.
 * @private
 * @async
 * @returns {Promise<object>} Uma promessa que resolve com o objeto contendo a lista de artigos.
 */
async function loadArticles(){
  try{
    const res = await fetch('./data/articles.json');
    if (!res.ok) throw new Error('HTTP '+res.status);
    return await res.json();
  } catch(_e){
    return { articles: [] };
  }
}

/**
 * Garante que a estrutura HTML do modal de artigos exista no DOM, criando-a
 * e anexando os ouvintes de evento na primeira vez que for chamada.
 * @private
 */
function ensureArticlesModal(){
  if (document.getElementById('articles-modal')) return;
  const html = `
    <div id="articles-overlay" class="fixed inset-0 bg-black/50 z-40 opacity-0 transition-opacity duration-300 hidden"></div>
    <div id="articles-modal" class="fixed inset-y-0 right-0 w-full max-w-2xl bg-white z-50 shadow-2xl transform translate-x-full transition-transform duration-300 flex flex-col" role="dialog" aria-modal="true" aria-labelledby="articles-title">
      <header class="flex items-center justify-between p-4 border-b">
        <h2 id="articles-title" class="text-lg font-semibold flex items-center gap-2">
          <span class="material-icons-outlined text-primary">newspaper</span>
          Artigos Publicados
        </h2>
        <button id="articles-close" class="p-1 rounded-full hover:bg-gray-100" aria-label="Fechar">
          <span class="material-icons-outlined">close</span>
        </button>
      </header>
      <div id="articles-content" class="flex-1 overflow-y-auto p-6"></div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  document.getElementById('articles-close').addEventListener('click', closeArticlesModal);
  document.getElementById('articles-overlay').addEventListener('click', closeArticlesModal);
  document.addEventListener('keydown', (ev)=>{ if (ev.key==='Escape') closeArticlesModal(); });
}

/**
 * Renderiza a lista de artigos dentro do contêiner de conteúdo do modal.
 * Ordena os artigos por data (do mais recente para o mais antigo) antes de renderizar.
 * @private
 * @param {object} data - O objeto de dados contendo um array `articles`.
 */
function renderArticlesList(data){
  const list = (data?.articles || []).sort((a,b)=> (b.date||'').localeCompare(a.date||''));
  const html = list.length ? `
    <div class="space-y-4">
      ${list.map(a=>`
        <article class="border rounded-lg p-4">
          <h3 class="font-semibold">${a.title}</h3>
          <p class="text-xs text-muted-foreground">${a.date || ''}${a.author ? ' • '+a.author : ''}</p>
          <p class="text-sm mt-2">${a.summary || ''}</p>
          ${a.url ? `<a class="text-sm text-primary hover:underline inline-flex items-center gap-1 mt-2" href="${a.url}" target="_blank" rel="noopener"><span class="material-icons-outlined text-base">open_in_new</span> Ler artigo</a>` : ''}
        </article>
      `).join('')}
    </div>` : '<p class="text-sm text-muted-foreground">Nenhum artigo publicado ainda.</p>';
  const area = document.getElementById('articles-content');
  if (area) area.innerHTML = html;
}

/**
 * Abre o modal de "Artigos Publicados".
 * Orquestra a criação do modal, o carregamento dos dados dos artigos, a renderização da lista
 * e a animação de exibição do modal e do overlay.
 * @public
 * @async
 */
export async function openArticlesModal(){
  ensureArticlesModal();
  const data = await loadArticles();
  renderArticlesList(data);
  const modal = document.getElementById('articles-modal');
  const overlay = document.getElementById('articles-overlay');
  overlay.classList.remove('hidden');
  setTimeout(()=>{ overlay.classList.remove('opacity-0'); modal.classList.remove('translate-x-full'); }, 10);
}

/**
 * Fecha o modal de "Artigos Publicados" com uma animação de transição.
 * @public
 */
export function closeArticlesModal(){
  const modal = document.getElementById('articles-modal');
  const overlay = document.getElementById('articles-overlay');
  if (!modal) return;
  overlay.classList.add('opacity-0');
  modal.classList.add('translate-x-full');
  setTimeout(()=> overlay.classList.add('hidden'), 300);
}

/**
 * Alias de `openArticlesModal` em português.
 * @type {typeof openArticlesModal}
 */
export const abrirModalArtigos = openArticlesModal;

/**
 * Alias de `closeArticlesModal` em português.
 * @type {typeof closeArticlesModal}
 */
export const fecharModalArtigos = closeArticlesModal;
