// Memoization utilities (simple). Designed for small numeric argument sets.
// Avoids over-engineering: single-arg and JSON-key multi-arg strategies.

export function memoizeOne(fn){
  const cache = new Map();
  return function(arg){
    if (cache.has(arg)) return cache.get(arg);
    const res = fn(arg);
    cache.set(arg, res);
    return res;
  };
}

export function memoize(fn){
  const cache = new Map();
  return function(...args){
    const key = args.length === 1 ? args[0] : JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const res = fn.apply(this, args);
    cache.set(key, res);
    return res;
  };
}

// Helper to expose cache stats optionally (could be extended later)
export function withStats(fn){
  const wrapped = fn;
  wrapped._hits = 0;
  wrapped._misses = 0;
  return function(...args){
    const key = args.length === 1 ? args[0] : JSON.stringify(args);
    if (wrapped._cache && wrapped._cache.has(key)) wrapped._hits++; else wrapped._misses++;
    return wrapped.apply(this, args);
  };
}
