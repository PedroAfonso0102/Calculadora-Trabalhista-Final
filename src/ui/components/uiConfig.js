/**
 * @file Configuração da Interface de Usuário (UI).
 * @module ui/components/uiConfig
 * @description Centraliza as configurações visuais e de comportamento dos componentes da UI,
 * como modais, tooltips, etc. Isso permite uma customização fácil e consistente
 * da aparência da aplicação a partir de um único local.
 */

/**
 * A fonte única da verdade para as configurações de componentes da UI.
 * Este objeto permite a configuração de propriedades visuais e de comportamento
 * que podem ser reutilizadas em toda a aplicação.
 * @type {object}
 * @property {object} modal - Configurações aplicáveis a todos os componentes de modal.
 * @property {boolean} modal.centered - Se `true`, o modal será centralizado vertical e horizontalmente na tela. Se `false`, pode ser posicionado manualmente.
 * @property {string} modal.maxWidthClass - A classe de utilidade do Tailwind CSS para definir a largura máxima do modal (ex: 'max-w-3xl').
 * @property {string} modal.maxHeightClass - A classe de utilidade do Tailwind CSS para definir a altura máxima do modal (ex: 'max-h-[90vh]').
 */
export const UI_CONFIG = {
  modal: {
    centered: true,
    maxWidthClass: 'max-w-3xl',
    maxHeightClass: 'max-h-[90vh]'
  }
};

/**
 * Exportação padrão do objeto de configuração da UI.
 * @default UI_CONFIG
 */
export default UI_CONFIG;
