import { helpCommand } from "./help";
import { resumeCommand } from "./resume";
import { routingCommand } from "./routing";
import { snakeCommand } from "./snake";
import type { Command, CommandResult } from "./types";

export const commands: Record<string, Command> = {
  [helpCommand.name]: helpCommand,
  [resumeCommand.name]: resumeCommand,
  [routingCommand.name]: routingCommand,
  [snakeCommand.name]: snakeCommand,
};

export const commandNames = Object.keys(commands);

export function dispatch(inputStr: string): CommandResult {
  const [name, ...args] = inputStr.split(" ");
  if (!name) return { kind: "output", lines: [""] };

  const command = commands[name];
  if (!command) return { kind: "output", lines: [`command not found: ${name}`] };

  return command.run(args, { commands });
}
