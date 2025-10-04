/**
 * @file Definições de Calculadoras.
 * @module data/calculators
 * @description Centraliza as definições estáticas para cada calculadora da aplicação,
 * incluindo seus rótulos de exibição e os ícones correspondentes do Material Icons.
 * Isso facilita a manutenção e a consistência da UI.
 */

/**
 * Um objeto que mapeia o ID de cada calculadora para suas propriedades de exibição.
 * Usado para renderizar a navegação (sidebar) e os títulos das páginas.
 * @type {Object.<string, {label: string, icon: string}>}
 * @property {{label: string, icon: string}} ferias - Configurações para a calculadora de Férias.
 * @property {{label: string, icon: string}} rescisao - Configurações para a calculadora de Rescisão.
 * @property {{label: string, icon: string}} decimoTerceiro - Configurações para a calculadora de 13º Salário.
 * @property {{label: string, icon: string}} salarioLiquido - Configurações para a calculadora de Salário Líquido.
 * @property {{label: string, icon: string}} fgts - Configurações para a calculadora de FGTS.
 * @property {{label: string, icon: string}} pisPasep - Configurações para a calculadora de PIS/PASEP.
 * @property {{label: string, icon: string}} seguroDesemprego - Configurações para a calculadora de Seguro-Desemprego.
 * @property {{label: string, icon: string}} horasExtras - Configurações para a calculadora de Horas Extras.
 * @property {{label: string, icon: string}} inss - Configurações para a calculadora de INSS.
 * @property {{label: string, icon: string}} valeTransporte - Configurações para a calculadora de Vale-Transporte.
 * @property {{label: string, icon: string}} irpf - Configurações para a calculadora de IRPF.
 */
export const CALCULATORS = {
  ferias: { label: 'Férias', icon: 'beach_access' },
  rescisao: { label: 'Rescisão', icon: 'work_off' },
  decimoTerceiro: { label: '13º Salário', icon: 'card_giftcard' },
  salarioLiquido: { label: 'Salário Líquido', icon: 'payments' },
  fgts: { label: 'FGTS', icon: 'account_balance' },
  pisPasep: { label: 'PIS/PASEP', icon: 'verified_user' },
  seguroDesemprego: { label: 'Seguro-Desemprego', icon: 'security' },
  horasExtras: { label: 'Horas Extras', icon: 'schedule' },
  inss: { label: 'INSS', icon: 'local_hospital' },
  valeTransporte: { label: 'Vale-Transporte', icon: 'commute' },
  irpf: { label: 'IRPF', icon: 'receipt_long' },
};

/**
 * Um array contendo todas as chaves (IDs) das calculadoras definidas em `CALCULATORS`.
 * Útil para iterar sobre todas as calculadoras disponíveis.
 * @type {string[]}
 */
export const CALCULATOR_KEYS = Object.keys(CALCULATORS);
