import { ValidationEngine } from '../src/core/validation.js';

function assert(cond, msg){ if(!cond) { console.error('FAIL:', msg); process.exit(1);} }

// Testa validações de campos individuais
(function testFieldValidations(){
  let res;
  res = ValidationEngine.validateField('salarioBruto', 0);
  assert(!res.isValid && /maior que zero/.test(res.message), 'salarioBruto zero deve falhar');

  res = ValidationEngine.validateField('salarioBruto', 1500);
  assert(res.isValid, 'salarioBruto positivo deve passar');

  res = ValidationEngine.validateField('diasFerias', 0);
  assert(!res.isValid, 'diasFerias 0 deve falhar');
  res = ValidationEngine.validateField('diasFerias', 15);
  assert(res.isValid, 'diasFerias 15 deve passar');

  // Validação de data (formato BR)
  res = ValidationEngine.validateField('dataAdmissao', '31/02/2024');
  assert(!res.isValid, 'dataAdmissao inválida deve falhar');
  res = ValidationEngine.validateField('dataAdmissao', '10/03/2024');
  assert(res.isValid, 'dataAdmissao válida deve passar');

  console.log('[OK] Field-level validations');
})();

// Testa validação entre campos: admissão antes da demissão
(function testCrossFieldDates(){
  const calcState = { dataAdmissao: '10/03/2024', dataDemissao: '09/03/2024' };
  const res = ValidationEngine.validateCalculatorState('rescisao', calcState);
  assert(!res.isValid && res.errors.dataAdmissao, 'admissão posterior à demissão deve falhar');

  const okState = { dataAdmissao: '01/01/2023', dataDemissao: '01/02/2023' };
  const res2 = ValidationEngine.validateCalculatorState('rescisao', okState);
  assert(res2.isValid, 'intervalo admissão-demissão correto deve passar');

  console.log('[OK] Cross-field date validation');
})();

// Testa se validateCalculatorState coleta erros
(function testCollectErrors(){
  const bad = { salarioBruto: 0, diasFerias: 40 };
  const r = ValidationEngine.validateCalculatorState('ferias', bad);
  assert(!r.isValid && r.errors.salarioBruto && r.errors.diasFerias, 'deve coletar múltiplos erros');
  console.log('[OK] Collection of errors');
})();

console.log('\nAll validation tests passed.');
