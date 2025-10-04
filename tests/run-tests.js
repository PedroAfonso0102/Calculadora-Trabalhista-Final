// Runner de Testes Unificados
// Este script importa e executa todos os arquivos de teste do projeto.

// Polyfill para localStorage no ambiente Node.js
if (typeof global.localStorage === 'undefined') {
  let store = {};
  global.localStorage = {
    getItem: key => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: key => { delete store[key]; },
    clear: () => { store = {}; }
  };
}

console.log('--- INICIANDO SUÍTE DE TESTES COMPLETA ---');

try {
  // Importa e executa cada arquivo de teste sequencialmente.
  // O 'await' garante que um teste termine antes do próximo começar, evitando saídas misturadas.
  await import('./acumulados-tests.js');
  await import('./decimo-terceiro-tests.js');
  await import('./fgts-tests.js');
  await import('./inss-tests.js');
  await import('./multi-ano-tests.js');
  await import('./parametros-tests.js');
  await import('./rescisao-tests.js');
  await import('./seguro-desemprego-tests.js');
  await import('./validation-tests.js');

  // Importa o novo arquivo de teste com as correções.
  await import('./correcoes-rescisao-tests.js');

  console.log('\n--- SUÍTE DE TESTES CONCLUÍDA ---');
  console.log('Todos os arquivos de teste foram executados com sucesso.');
  process.exit(0);

} catch (error) {
  console.error('\n--- UM ERRO OCORREU DURANTE OS TESTES ---');
  console.error(error.message);
  process.exit(1); // Encerra o processo com um código de erro.
}
