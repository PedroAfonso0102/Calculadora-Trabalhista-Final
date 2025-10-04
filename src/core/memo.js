/**
 * @file Utilitários de Memoização.
 * @module core/memo
 * @description Fornece funções de alta ordem (Higher-Order Functions) para "memoizar"
 * outras funções. Memoização é uma técnica de otimização que armazena os resultados
 * de chamadas de função custosas e retorna o resultado em cache quando os mesmos
 * inputs ocorrem novamente.
 */

/**
 * Cria uma versão memoizada de uma função que aceita um único argumento primitivo.
 * Esta é uma implementação otimizada para o caso de uso comum de um único argumento,
 * usando um `Map` para um cache de alta performance.
 * @param {Function} fn - A função a ser memoizada. A função deve ser pura (retornar sempre o mesmo resultado para os mesmos argumentos).
 * @returns {Function} Uma nova função que armazena em cache os resultados da função original.
 * @template T, R
 * @param {(arg: T) => R} fn
 * @returns {(arg: T) => R}
 */
export function memoizeOne(fn){
  const cache = new Map();
  return function(arg){
    if (cache.has(arg)) return cache.get(arg);
    const res = fn(arg);
    cache.set(arg, res);
    return res;
  };
}

/**
 * Cria uma versão memoizada de uma função que aceita múltiplos argumentos.
 * A chave do cache é gerada serializando os argumentos para uma string JSON.
 * Ideal para funções puras com múltiplos argumentos primitivos ou objetos serializáveis.
 * @param {Function} fn - A função a ser memoizada.
 * @returns {Function} A nova função memoizada.
 * @template T, R
 * @param {(...args: T[]) => R} fn
 * @returns {(...args: T[]) => R}
 */
export function memoize(fn){
  const cache = new Map();
  return function(...args){
    // Otimização para o caso comum de argumento único.
    const key = args.length === 1 ? args[0] : JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const res = fn.apply(this, args);
    cache.set(key, res);
    return res;
  };
}

/**
 * Envolve uma função memoizada para rastrear o número de acertos (hits) e falhas (misses) do cache.
 * Esta é uma função auxiliar para depuração e análise de desempenho, permitindo
 * verificar a eficácia da memoização.
 * @param {Function} memoizedFn - A função já memoizada a ser observada.
 * @returns {Function} A função original, mas com propriedades `_hits` e `_misses` adicionadas para inspeção.
 * @deprecated Esta função depende de detalhes de implementação do cache e é primariamente para depuração.
 */
export function withStats(memoizedFn){
  const wrapped = memoizedFn;
  wrapped._hits = 0;
  wrapped._misses = 0;

  // Esta é uma suposição sobre a implementação interna de memoize/memoizeOne.
  // Pode ser frágil se a implementação do cache mudar.
  const originalCache = new Map();
  const cacheProperty = '_cache'; // Propriedade hipotética para acessar o cache

  // Substitui a função memoizada por uma que rastreia hits/misses
  const newMemoized = function(...args) {
      const key = args.length === 1 ? args[0] : JSON.stringify(args);

      if (originalCache.has(key)) {
          wrapped._hits++;
      } else {
          wrapped._misses++;
      }
      const result = wrapped.apply(this, args);
      if (!originalCache.has(key)) {
        originalCache.set(key, result);
      }
      return result;
  };

  // Anexa o cache e as estatísticas à nova função para inspeção
  newMemoized[cacheProperty] = originalCache;
  newMemoized._hits = wrapped._hits;
  newMemoized._misses = wrapped._misses;

  return newMemoized;
}
