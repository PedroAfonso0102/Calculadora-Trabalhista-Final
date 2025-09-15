// Interação com localStorage.
/**
 * Storage Service
 *
 * This module centralizes all localStorage operations to improve code cohesion
 * and make storage management easier to maintain and debug. It abstracts
 * the direct use of the localStorage API.
 */

/**
 * Storage keys used throughout the application.
 */
export const STORAGE_KEYS = {
    APP_STATE: 'trabalhista:appState',
    SAVE_PREFERENCE: 'trabalhista:savePreference',
    VISIBLE_CALCULATORS: 'trabalhista:visibleCalculators',
    SIDEBAR_STATE: 'trabalhista:sidebarState',
    PARAM_YEAR: 'trabalhista:paramYear',
    THEME: 'trabalhista:theme'
};

/**
 * Safely gets an item from localStorage with JSON parsing support.
 * @param {string} key - The localStorage key.
 * @param {*} [defaultValue=null] - Value to return if key doesn't exist or parsing fails.
 * @returns {*} The parsed value or default value.
 */
export function getStorageItem(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Failed to get/parse localStorage item "${key}":`, error);
        return defaultValue;
    }
}

/**
 * Safely sets an item in localStorage with JSON stringification.
 * @param {string} key - The localStorage key.
 * @param {*} value - The value to store.
 * @returns {boolean} True if successful, false otherwise.
 */
export function setStorageItem(key, value) {
    try {
        const valueToStore = JSON.stringify(value);
        localStorage.setItem(key, valueToStore);
        return true;
    } catch (error) {
        console.error(`Failed to set localStorage item "${key}":`, error);
        return false;
    }
}

/**
 * Gets the saved application state from localStorage.
 * @returns {Object|null} The saved state object or null.
 */
export function getSavedState() {
    return getStorageItem(STORAGE_KEYS.APP_STATE, null);
}

/**
 * Saves the application state to localStorage.
 * @param {Object} stateToSave - The state object to save.
 */
export function saveState(stateToSave) {
    setStorageItem(STORAGE_KEYS.APP_STATE, stateToSave);
}

/**
 * Gets the list of calculators the user has chosen to be visible.
 * @returns {string[]} Array of visible calculator IDs.
 */
export function getVisibleCalculators() {
    const defaultCalculators = [
        'ferias', 'rescisao', 'decimoTerceiro', 'salarioLiquido', 'fgts',
        'pisPasep', 'seguroDesemprego', 'horasExtras', 'inss', 'valeTransporte', 'irpf'
    ];
    return getStorageItem(STORAGE_KEYS.VISIBLE_CALCULATORS, defaultCalculators);
}

// Parâmetros: ano selecionado
export function getSelectedParamYear(defaultYear = 2025){
    return getStorageItem(STORAGE_KEYS.PARAM_YEAR, defaultYear);
}
export function setSelectedParamYear(year){
    setStorageItem(STORAGE_KEYS.PARAM_YEAR, year);
}

// Tema (light | dark | system)
export function getTheme(defaultTheme = 'system'){
    return getStorageItem(STORAGE_KEYS.THEME, defaultTheme);
}
export function setTheme(theme){
    setStorageItem(STORAGE_KEYS.THEME, theme);
}

// Preferência de salvamento de estado (boolean)
export function getSavePreference(defaultValue = false){
    return getStorageItem(STORAGE_KEYS.SAVE_PREFERENCE, defaultValue);
}
export function setSavePreference(val){
    setStorageItem(STORAGE_KEYS.SAVE_PREFERENCE, !!val);
}
