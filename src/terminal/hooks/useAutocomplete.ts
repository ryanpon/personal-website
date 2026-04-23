import { matchPrefix } from "../autocomplete";

export function useAutocomplete(
  inputVal: string,
  options: string[],
  fallback: string | null,
) {
  const match = inputVal ? matchPrefix(inputVal, options) : fallback;
  const suggestion = match ? match.slice(inputVal.length) : "";
  return { match, suggestion };
}
