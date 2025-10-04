/**
 * @file Módulo para o Modal "Sobre a Ferramenta".
 * @module features/content/about
 * @description Gerencia a criação, exibição e ocultação do modal lateral que contém
 * informações sobre o projeto, como visão geral, história e tecnologias utilizadas.
 */

/**
 * Garante que o HTML do modal "Sobre" e seu overlay existam no DOM, criando-os
 * na primeira chamada. Também anexa os ouvintes de eventos necessários para fechar o modal.
 * Esta função é idempotente.
 * @private
 */
function ensureAboutModal() {
  if (document.getElementById('about-modal')) return;
  const html = `
    <div id="about-overlay" class="fixed inset-0 bg-black/50 z-40 opacity-0 transition-opacity duration-300 hidden"></div>
    <div id="about-modal" class="fixed inset-y-0 right-0 w-full max-w-2xl bg-white z-50 shadow-2xl transform translate-x-full transition-transform duration-300 flex flex-col" role="dialog" aria-modal="true" aria-labelledby="about-title">
      <header class="flex items-center justify-between p-4 border-b">
        <h2 id="about-title" class="text-lg font-semibold flex items-center gap-2">
          <span class="material-icons-outlined text-primary">info</span>
          Sobre a Ferramenta
        </h2>
        <button id="about-close" class="p-1 rounded-full hover:bg-gray-100" aria-label="Fechar">
          <span class="material-icons-outlined">close</span>
        </button>
      </header>
      <div class="flex-1 overflow-y-auto p-6 prose prose-sm max-w-none">
        <h3>Visão Geral</h3>
        <p>Esta calculadora trabalhista é uma aplicação front‑end modular focada em clareza, transparência e atualização de regras legais por ano. Ela reúne calculadoras como férias, rescisão, 13º, salário líquido, FGTS, INSS e IRRF, além de uma base de conhecimento integrada.</p>

        <h3>História do Projeto</h3>
        <p>O projeto surgiu da necessidade de comparar cenários e regras multi‑ano com rastreabilidade. A arquitetura separa a lógica de cálculos da interface, viabilizando manutenção e evolução sem retrabalho visual.</p>

        <h3>Tecnologias</h3>
        <ul>
          <li>HTML + JavaScript (ES Modules)</li>
          <li>TailwindCSS para estilos</li>
          <li>jsPDF para exportação</li>
          <li>LocalStorage para preferências</li>
        </ul>

        <h3>Como contribuir</h3>
        <p>Veja o README do repositório para instruções de build, testes e parametrização por ano.</p>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  document.getElementById('about-close').addEventListener('click', closeAboutModal);
  document.getElementById('about-overlay').addEventListener('click', closeAboutModal);
  document.addEventListener('keydown', (ev)=>{ if (ev.key==='Escape') closeAboutModal(); });
}

/**
 * Abre o modal "Sobre".
 * Esta função primeiro garante que o modal exista no DOM e, em seguida,
 * o torna visível aplicando transições de CSS para o overlay e o painel do modal.
 * @public
 */
export function openAboutModal(){
  ensureAboutModal();
  const modal = document.getElementById('about-modal');
  const overlay = document.getElementById('about-overlay');
  overlay.classList.remove('hidden');
  setTimeout(()=>{ overlay.classList.remove('opacity-0'); modal.classList.remove('translate-x-full'); }, 10);
}

/**
 * Fecha o modal "Sobre".
 * Oculta o modal e seu overlay aplicando as transições de CSS reversas.
 * @public
 */
export function closeAboutModal(){
  const modal = document.getElementById('about-modal');
  const overlay = document.getElementById('about-overlay');
  if (!modal) return;
  overlay.classList.add('opacity-0');
  modal.classList.add('translate-x-full');
  setTimeout(()=> overlay.classList.add('hidden'), 300);
}

/**
 * Alias de `openAboutModal` em português.
 * @type {typeof openAboutModal}
 */
export const abrirModalSobre = openAboutModal;

/**
 * Alias de `closeAboutModal` em português.
 * @type {typeof closeAboutModal}
 */
export const fecharModalSobre = closeAboutModal;
