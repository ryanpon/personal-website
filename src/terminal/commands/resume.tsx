import { colorSpan, colors } from "../colors";
import { resumeEntries } from "../resume";
import type { Command } from "./types";

export const resumeCommand: Command = {
  name: "resume",
  help: "See Ryan's resume.",
  options: Object.keys(resumeEntries),
  run: (args) => {
    if (args.length === 0) {
      return {
        kind: "output",
        lines: [
          <div>
            <div>
              `resume {colorSpan("company_name", colors.lightPurple)}` for more info.
            </div>
            {Object.entries(resumeEntries).map(([company, entry]) => (
              <div key={company}>
                &nbsp;&nbsp;[{colorSpan(company, colors.purple)}] :: {entry.startYear}-{entry.endYear} :: {entry.tagLine}
              </div>
            ))}
          </div>,
        ],
      };
    }

    return {
      kind: "output",
      lines: args.flatMap(arg => {
        const entry = resumeEntries[arg];
        if (!entry) {
          return [`resume: company not found: ${arg}`];
        }
        return [
          `${arg} :: ${entry.startYear}-${entry.endYear} ::`,
          ...entry.longLines.map((l, i) => (
            <span key={i}>&nbsp;&nbsp;{l}</span>
          )),
        ];
      }),
    };
  },
};
