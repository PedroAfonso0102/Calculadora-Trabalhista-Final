/**
 * @file Módulo para o Modal "Glossário de Termos".
 * @module features/content/glossary
 * @description Gerencia a criação, exibição e interatividade do modal que
 * apresenta um glossário de termos trabalhistas com funcionalidade de busca.
 */

/**
 * Uma lista padrão de termos e definições para o glossário.
 * @private
 * @type {Array<{term: string, def: string}>}
 */
const DEFAULT_TERMS = [
  { term: 'FGTS', def: 'Fundo de Garantia do Tempo de Serviço. Depósitos mensais de 8% do salário.' },
  { term: 'INSS', def: 'Contribuição previdenciária com alíquotas progressivas conforme a faixa salarial.' },
  { term: 'IRRF', def: 'Imposto de Renda Retido na Fonte, calculado sobre a base após INSS e deduções.' },
  { term: 'Abono Pecuniário', def: 'Venda de 1/3 das férias, convertendo 10 dias em pagamento.' },
  { term: 'Aviso Prévio', def: 'Período que antecede a rescisão. Pode ser trabalhado ou indenizado.' }
];

/**
 * Garante que o HTML do modal de glossário e seu overlay existam no DOM,
 * criando-os e anexando os ouvintes de eventos na primeira chamada.
 * @private
 */
function ensureGlossaryModal(){
  if (document.getElementById('glossary-modal')) return;
  const html = `
    <div id="glossary-overlay" class="fixed inset-0 bg-black/50 z-40 opacity-0 transition-opacity duration-300 hidden"></div>
    <div id="glossary-modal" class="fixed inset-y-0 right-0 w-full max-w-2xl bg-white z-50 shadow-2xl transform translate-x-full transition-transform duration-300 flex flex-col" role="dialog" aria-modal="true" aria-labelledby="glossary-title">
      <header class="flex items-center justify-between p-4 border-b">
        <h2 id="glossary-title" class="text-lg font-semibold flex items-center gap-2">
          <span class="material-icons-outlined text-primary">library_books</span>
          Glossário de Termos
        </h2>
        <button id="glossary-close" class="p-1 rounded-full hover:bg-gray-100" aria-label="Fechar">
          <span class="material-icons-outlined">close</span>
        </button>
      </header>
      <div class="p-4 border-b">
        <div class="relative">
          <span class="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
          <input type="text" id="glossary-search" placeholder="Buscar termo..." class="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:outline-none" />
        </div>
      </div>
      <div id="glossary-content" class="flex-1 overflow-y-auto p-6 prose prose-sm max-w-none"></div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  document.getElementById('glossary-close').addEventListener('click', closeGlossaryModal);
  document.getElementById('glossary-overlay').addEventListener('click', closeGlossaryModal);
  document.getElementById('glossary-search').addEventListener('input', ()=> renderTerms());
  document.addEventListener('keydown', (ev)=>{ if (ev.key==='Escape') closeGlossaryModal(); });
}

/**
 * Array que armazena os termos do glossário. Inicializado com os termos padrão.
 * Pode ser estendido no futuro para carregar de uma fonte externa.
 * @private
 * @type {Array<{term: string, def: string}>}
 */
let terms = DEFAULT_TERMS;

/**
 * Renderiza a lista de termos do glossário no contêiner de conteúdo do modal.
 * Filtra os termos com base no valor atual do campo de busca e os ordena alfabeticamente.
 * @private
 */
function renderTerms(){
  const query = (document.getElementById('glossary-search')?.value || '').toLowerCase();
  const list = terms
    .filter(t => t.term.toLowerCase().includes(query) || t.def.toLowerCase().includes(query))
    .sort((a,b)=> a.term.localeCompare(b.term));
  const html = `
    <dl class="space-y-3">
      ${list.map(t=>`
        <div>
          <dt class="font-medium">${t.term}</dt>
          <dd class="text-sm text-gray-700">${t.def}</dd>
        </div>
      `).join('')}
    </dl>`;
  const area = document.getElementById('glossary-content');
  if (area) area.innerHTML = html || '<p>Nenhum termo encontrado.</p>';
}

/**
 * Abre o modal "Glossário de Termos".
 * Garante que o modal exista, renderiza a lista de termos e exibe o modal com uma animação.
 * @public
 */
export function openGlossaryModal(){
  ensureGlossaryModal();
  renderTerms();
  const modal = document.getElementById('glossary-modal');
  const overlay = document.getElementById('glossary-overlay');
  overlay.classList.remove('hidden');
  setTimeout(()=>{ overlay.classList.remove('opacity-0'); modal.classList.remove('translate-x-full'); }, 10);
}

/**
 * Fecha o modal "Glossário de Termos" com uma animação de transição.
 * @public
 */
export function closeGlossaryModal(){
  const modal = document.getElementById('glossary-modal');
  const overlay = document.getElementById('glossary-overlay');
  if (!modal) return;
  overlay.classList.add('opacity-0');
  modal.classList.add('translate-x-full');
  setTimeout(()=> overlay.classList.add('hidden'), 300);
}

/**
 * Alias de `openGlossaryModal` em português.
 * @type {typeof openGlossaryModal}
 */
export const abrirModalGlossario = openGlossaryModal;

/**
 * Alias de `closeGlossaryModal` em português.
 * @type {typeof closeGlossaryModal}
 */
export const fecharModalGlossario = closeGlossaryModal;
