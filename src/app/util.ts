export function tapLog(str: string, val: unknown) {
  console.log(str, val);
  return val;
}

export function round(value: number, decimals: number) {
  return value.toFixed(decimals);
}
