import { matchPrefix } from "../autocomplete";
import { commands, commandNames } from "../commands/index";

export function useAutocomplete(
  inputVal: string,
  fallback: string | null,
) {
  const [cmdName, ...args] = inputVal.split(" ");
  const lastArg = args.at(-1);
  const match = cmdName ? matchPrefix(cmdName, commandNames) : fallback;
  if (cmdName !== match) {
    // They've typed a substring, not a full command.
    const suggestion = match ? match.slice(inputVal.length) : "";
    return { match, suggestion };
  }

  const command = commands[match];
  if (!command.options || !lastArg) {
    return { match, suggestion: "" };
  }
  // Else, they've typed a full command and we can autocomplete its last arg.
  const lastArgMatch = matchPrefix(lastArg, command.options);
  const suggestion = lastArgMatch ? lastArgMatch.slice(lastArg.length) : "";
  return { match: inputVal + suggestion, suggestion };
}
