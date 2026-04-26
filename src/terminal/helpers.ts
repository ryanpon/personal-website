export function pad(s: string | number, width: number, right = false) {
  const str = String(s);
  if (str.length >= width) return str.slice(0, width);
  const fill = " ".repeat(width - str.length);
  return right ? str + fill : fill + str;
}
