/**
 * @file Módulo de Serviço de Armazenamento.
 * @module services/storage
 * @description Centraliza todas as operações com o `localStorage` do navegador.
 * Este módulo abstrai a leitura e escrita de dados, tratando de serialização (JSON),
 * parsing e tratamento de erros de forma consistente em um único local.
 */

/**
 * Um objeto que centraliza todas as chaves de `localStorage` usadas na aplicação,
 * prevenindo erros de digitação e facilitando a manutenção.
 * @readonly
 * @enum {string}
 */
export const CHAVES_ARMAZENAMENTO = {
    ESTADO_APP: 'trabalhista:appState',
    PREFERENCIA_SALVAR: 'trabalhista:savePreference',
    CALCULADORAS_VISIVEIS: 'trabalhista:visibleCalculators',
    ESTADO_SIDEBAR: 'trabalhista:sidebarState',
    ANO_PARAMETROS: 'trabalhista:paramYear',
    TEMA: 'trabalhista:theme',
    USAR_SALARIO_GLOBAL: 'trabalhista:useGlobalSalary'
};

/** @deprecated Usar `CHAVES_ARMAZENAMENTO`. */
export const STORAGE_KEYS = CHAVES_ARMAZENAMENTO;

/**
 * Busca um item no `localStorage`, faz o parsing de JSON e retorna um valor padrão em caso de erro.
 * @param {string} chave - A chave do item a ser recuperado do `localStorage`.
 * @param {*} [valorPadrao=null] - O valor a ser retornado se a chave não for encontrada ou se ocorrer um erro no parsing.
 * @returns {*} O valor recuperado e desserializado, ou o valor padrão.
 */
export function obterItemArmazenamento(chave, valorPadrao = null) {
    try {
        const item = localStorage.getItem(chave);
        return item ? JSON.parse(item) : valorPadrao;
    } catch (erro) {
        console.error(`Falha ao obter/analisar item do localStorage "${chave}":`, erro);
        return valorPadrao;
    }
}

/** @deprecated Usar `obterItemArmazenamento`. */
export function getStorageItem(chave, valorPadrao = null) {
    return obterItemArmazenamento(chave, valorPadrao);
}

/**
 * Salva um item no `localStorage`, serializando-o para uma string JSON.
 * @param {string} chave - A chave sob a qual o valor será armazenado.
 * @param {*} valor - O valor a ser armazenado (será convertido para JSON).
 * @returns {boolean} Retorna `true` se a operação for bem-sucedida, `false` caso contrário.
 */
export function definirItemArmazenamento(chave, valor) {
    try {
        const valorParaArmazenar = JSON.stringify(valor);
        localStorage.setItem(chave, valorParaArmazenar);
        return true;
    } catch (erro) {
        console.error(`Falha ao definir item do localStorage "${chave}":`, erro);
        return false;
    }
}

/** @deprecated Usar `definirItemArmazenamento`. */
export function setStorageItem(chave, valor) {
    return definirItemArmazenamento(chave, valor);
}

/**
 * Obtém o estado completo da aplicação que foi salvo no `localStorage`.
 * @returns {object|null} O objeto de estado salvo, ou `null` se não houver estado salvo.
 */
export function obterEstadoSalvo() {
    return obterItemArmazenamento(CHAVES_ARMAZENAMENTO.ESTADO_APP, null);
}

/** @deprecated Usar `obterEstadoSalvo`. */
export function getSavedState() {
    return obterEstadoSalvo();
}

/**
 * Salva o estado completo da aplicação no `localStorage`.
 * @param {object} estadoParaSalvar - O objeto de estado a ser serializado e salvo.
 */
export function salvarEstado(estadoParaSalvar) {
    definirItemArmazenamento(CHAVES_ARMAZENAMENTO.ESTADO_APP, estadoParaSalvar);
}

/** @deprecated Usar `salvarEstado`. */
export function saveState(estadoParaSalvar) {
    return salvarEstado(estadoParaSalvar);
}

/**
 * Obtém a lista de IDs das calculadoras que o usuário escolheu para serem visíveis na navegação.
 * @returns {string[]} Um array de IDs de calculadoras. Retorna uma lista padrão se nenhuma preferência for encontrada.
 */
export function obterCalculadorasVisiveis() {
    const calculadorasPadrao = [
        'ferias', 'rescisao', 'decimoTerceiro', 'salarioLiquido', 'fgts',
        'pisPasep', 'seguroDesemprego', 'horasExtras', 'inss', 'valeTransporte', 'irpf'
    ];
    return obterItemArmazenamento(CHAVES_ARMAZENAMENTO.CALCULADORAS_VISIVEIS, calculadorasPadrao);
}

/** @deprecated Usar `obterCalculadorasVisiveis`. */
export function getVisibleCalculators() {
    return obterCalculadorasVisiveis();
}

/**
 * Obtém o ano de referência para os parâmetros de cálculo selecionado pelo usuário.
 * @param {number} [anoPadrao=2025] - O ano padrão a ser retornado se nenhuma preferência for encontrada.
 * @returns {number} O ano selecionado.
 */
export function obterAnoParametrosSelecionado(anoPadrao = 2025){
    return obterItemArmazenamento(CHAVES_ARMAZENAMENTO.ANO_PARAMETROS, anoPadrao);
}

/**
 * Salva o ano de referência para os parâmetros de cálculo selecionado pelo usuário.
 * @param {number} ano - O ano a ser salvo.
 */
export function definirAnoParametrosSelecionado(ano){
    definirItemArmazenamento(CHAVES_ARMAZENAMENTO.ANO_PARAMETROS, ano);
}

/** @deprecated Usar `obterAnoParametrosSelecionado`. */
export function getSelectedParamYear(anoPadrao = 2025){
    return obterAnoParametrosSelecionado(anoPadrao);
}
/** @deprecated Usar `definirAnoParametrosSelecionado`. */
export function setSelectedParamYear(ano){
    return definirAnoParametrosSelecionado(ano);
}

/**
 * Obtém o tema da interface ('light', 'dark', ou 'system') selecionado pelo usuário.
 * @param {string} [temaPadrao='system'] - O tema padrão a ser retornado.
 * @returns {string} O tema selecionado.
 */
export function obterTema(temaPadrao = 'system'){
    return obterItemArmazenamento(CHAVES_ARMAZENAMENTO.TEMA, temaPadrao);
}

/**
 * Salva a preferência de tema da interface do usuário.
 * @param {string} tema - O tema a ser salvo ('light', 'dark', ou 'system').
 */
export function definirTema(tema){
    definirItemArmazenamento(CHAVES_ARMAZENAMENTO.TEMA, tema);
}

/** @deprecated Usar `obterTema`. */
export function getTheme(temaPadrao = 'system'){
    return obterTema(temaPadrao);
}
/** @deprecated Usar `definirTema`. */
export function setTheme(tema){
    return definirTema(tema);
}

/**
 * Obtém a preferência do usuário sobre usar um salário global sincronizado entre as calculadoras.
 * @param {boolean} [valorPadrao=true] - O valor padrão para a preferência.
 * @returns {boolean} Retorna `true` se o salário global deve ser usado, `false` caso contrário.
 */
export function obterUsarSalarioGlobal(valorPadrao = true){
    return obterItemArmazenamento(CHAVES_ARMAZENAMENTO.USAR_SALARIO_GLOBAL, valorPadrao);
}

/**
 * Salva a preferência do usuário sobre usar um salário global sincronizado.
 * @param {boolean} valor - O valor da preferência a ser salvo.
 */
export function definirUsarSalarioGlobal(valor){
    definirItemArmazenamento(CHAVES_ARMAZENAMENTO.USAR_SALARIO_GLOBAL, !!valor);
}

/** @deprecated Usar `obterUsarSalarioGlobal`. */
export function getUseGlobalSalary(valorPadrao = true){
    return obterUsarSalarioGlobal(valorPadrao);
}
/** @deprecated Usar `definirUsarSalarioGlobal`. */
export function setUseGlobalSalary(valor){
    return definirUsarSalarioGlobal(valor);
}

/**
 * Obtém a preferência do usuário sobre salvar o estado da aplicação automaticamente.
 * @param {boolean} [valorPadrao=false] - O valor padrão para a preferência.
 * @returns {boolean} Retorna `true` se o estado deve ser salvo, `false` caso contrário.
 */
export function obterPreferenciaSalvar(valorPadrao = false){
    return obterItemArmazenamento(CHAVES_ARMAZENAMENTO.PREFERENCIA_SALVAR, valorPadrao);
}

/**
 * Salva a preferência do usuário sobre salvar o estado da aplicação automaticamente.
 * @param {boolean} valor - O valor da preferência a ser salvo.
 */
export function definirPreferenciaSalvar(valor){
    definirItemArmazenamento(CHAVES_ARMAZENAMENTO.PREFERENCIA_SALVAR, !!valor);
}

/** @deprecated Usar `obterPreferenciaSalvar`. */
export function getSavePreference(valorPadrao = false){
    return obterPreferenciaSalvar(valorPadrao);
}
/** @deprecated Usar `definirPreferenciaSalvar`. */
export function setSavePreference(valor){
    return definirPreferenciaSalvar(valor);
}

/**
 * Obtém o estado salvo de abertura/fechamento das seções da barra lateral.
 * @param {object} [valorPadrao={ calculators: true, content: false }] - O estado padrão a ser retornado.
 * @returns {object} O objeto com o estado da barra lateral (ex: `{ calculators: true, content: false }`).
 */
export function obterEstadoSidebar(valorPadrao = { calculators: true, content: false }){
    return obterItemArmazenamento(CHAVES_ARMAZENAMENTO.ESTADO_SIDEBAR, valorPadrao);
}

/**
 * Salva o estado de abertura/fechamento das seções da barra lateral.
 * A função mescla o estado parcial fornecido com o estado atual salvo.
 * @param {object} parcial - Um objeto parcial com as chaves a serem atualizadas (ex: `{ calculators: true }`).
 * @returns {boolean} Retorna `true` se a operação for bem-sucedida, `false` caso contrário.
 */
export function definirEstadoSidebar(parcial){
    try {
        const atual = obterEstadoSidebar();
        const proximo = { ...atual, ...(parcial || {}) };
        definirItemArmazenamento(CHAVES_ARMAZENAMENTO.ESTADO_SIDEBAR, proximo);
        return true;
    } catch (e){
        console.error('[storage] falha ao persistir estado da sidebar', e);
        return false;
    }
}

/** @deprecated Usar `obterEstadoSidebar`. */
export function getSidebarState(valorPadrao = { calculators: true, content: false }){
    return obterEstadoSidebar(valorPadrao);
}
/** @deprecated Usar `definirEstadoSidebar`. */
export function setSidebarState(parcial){
    return definirEstadoSidebar(parcial);
}
