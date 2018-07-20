export function tapLog(str, val) {
  console.log(str, val);
  return val;
}

export function round(value, decimals) {
  return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
}
