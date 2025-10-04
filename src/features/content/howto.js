/**
 * @file Módulo para o Modal "Como Funciona".
 * @module features/content/howto
 * @description Gerencia a criação e o controle de visibilidade do modal que
 * fornece um guia rápido sobre como utilizar a calculadora.
 */

/**
 * Garante que a estrutura HTML do modal "Como Funciona" e seu overlay existam no DOM.
 * Cria os elementos e anexa os ouvintes de evento para fechamento na primeira chamada.
 * @private
 */
function ensureHowto(){
  if (document.getElementById('howto-modal')) return;
  const html = `
    <div id="howto-overlay" class="fixed inset-0 bg-black/50 z-40 opacity-0 transition-opacity duration-300 hidden"></div>
    <div id="howto-modal" class="fixed inset-y-0 right-0 w-full max-w-2xl bg-white z-50 shadow-2xl transform translate-x-full transition-transform duration-300 flex flex-col" role="dialog" aria-modal="true" aria-labelledby="howto-title">
      <header class="flex items-center justify-between p-4 border-b">
        <h2 id="howto-title" class="text-lg font-semibold flex items-center gap-2">
          <span class="material-icons-outlined text-primary">help</span>
          Como Funciona
        </h2>
        <button id="howto-close" class="p-1 rounded-full hover:bg-gray-100" aria-label="Fechar">
          <span class="material-icons-outlined">close</span>
        </button>
      </header>
      <div class="flex-1 overflow-y-auto p-6 prose prose-sm max-w-none">
        <ol>
          <li><strong>Escolha a calculadora</strong> no menu lateral ou nos atalhos da Home.</li>
          <li><strong>Preencha os campos</strong> principais (salário, datas, dependentes). Campos em R$ aceitam máscara.</li>
          <li><strong>Veja os resultados</strong> atualizados em tempo real com bases, descontos e totais.</li>
          <li><strong>Imprima em PDF</strong> usando o botão no topo da seção de resultados.</li>
          <li><strong>Altere o Ano</strong> no cabeçalho para comparar regras de exercícios diferentes.</li>
        </ol>
        <h3 class="mt-4">Dicas</h3>
        <ul>
          <li>Use o <em>Simulador Rápido</em> na Home para um panorama do salário líquido.</li>
          <li>Consulte o <em>Glossário</em> para termos legais e o <em>FAQ</em> para dúvidas comuns.</li>
        </ul>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  document.getElementById('howto-close').addEventListener('click', closeHowtoModal);
  document.getElementById('howto-overlay').addEventListener('click', closeHowtoModal);
  document.addEventListener('keydown', (ev)=>{ if (ev.key==='Escape') closeHowtoModal(); });
}

/**
 * Abre o modal "Como Funciona", garantindo sua existência no DOM e aplicando
 * animações de entrada para o modal e seu overlay.
 * @public
 */
export function openHowtoModal(){
  ensureHowto();
  const modal = document.getElementById('howto-modal');
  const overlay = document.getElementById('howto-overlay');
  overlay.classList.remove('hidden');
  setTimeout(()=>{ overlay.classList.remove('opacity-0'); modal.classList.remove('translate-x-full'); }, 10);
}

/**
 * Fecha o modal "Como Funciona" com animações de saída para o modal e seu overlay.
 * @public
 */
export function closeHowtoModal(){
  const modal = document.getElementById('howto-modal');
  const overlay = document.getElementById('howto-overlay');
  if (!modal) return;
  overlay.classList.add('opacity-0');
  modal.classList.add('translate-x-full');
  setTimeout(()=> overlay.classList.add('hidden'), 300);
}
