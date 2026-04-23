export function matchPrefix(value: string, options: string[]): string | null {
  if (!value) return null;
  return options.find(s => s.toLowerCase().startsWith(value.toLowerCase())) ?? null;
}
