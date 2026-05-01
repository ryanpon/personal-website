export function pad(s: string | number, width: number, right = false) {
  const str = String(s);
  if (str.length >= width) return str.slice(0, width);
  const fill = " ".repeat(width - str.length);
  return right ? str + fill : fill + str;
}
export function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}
export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}