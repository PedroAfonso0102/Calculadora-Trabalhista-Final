// Utilitário de arredondamento monetário (2 casas) com estratégia half-up.
// Evita problemas de flutuação binária usando multiplicação inteira.
export function round2(v){
  if (!v || isNaN(v)) return 0;
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

export function format2(v){
  return round2(v).toFixed(2);
}
