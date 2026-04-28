import { colorSpan, colors } from "../colors";
import type { Command } from "./types";
import type { ReactNode } from "react";

export type ResumeEntry = {
  startYear: number;
  endYear: number;
  tagLine: string;
  longLines: Array<string | ReactNode>;
};

export const resumeEntries: Record<string, ResumeEntry> = {
  block: {
    startYear: 2016,
    endYear: 2026,
    tagLine: "Tech lead for Square's merchant lending platform.",
    longLines: [
      "Tech lead for Square Loans 2021-2026, software engineer from 2016.",
      "",
      "Led platform engineering across 6 teams. The program originated billions",
      "a year and the platform processed several million payments a day.",
      "",
      "Architect behind several major systems in the platform.",
    ],
  },
  earnest: {
    startYear: 2014,
    endYear: 2016,
    tagLine: "I built a student lending platform from scratch.",
    longLines: [
      "I built a Loan Management System (LMS) from scratch.",
      "",
      "Established best practices like code review, test coverage, linting, CI.",
      "",
      "Did security work on the side and found an account takeover vuln!",
    ],
  },
  quad_analytix: {
    startYear: 2013,
    endYear: 2014,
    tagLine: "I made a frontend for data entry.",
    longLines: [
      "Frontend engineer on a data entry platform.",
      "",
      "Migrated the UI from an outdated from to a framework which now also outdated.",
    ],
  },
  shortcircuit: {
    startYear: 2012,
    endYear: 2013,
    tagLine: "I made a public transit routing app.",
    longLines: [
      "Made the backend for Rover, a realtime public transit routing app with",
      "",
      "Implemented a bunch of fun routing algorithms.",
      "",
      (<span>Try running `{colorSpan('routing', colors.lightPurple)}` in the terminal!</span>),
    ],
  },
};

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
                [{colorSpan(company, colors.purple)}] :: {entry.startYear}-{entry.endYear} ::
                {
                  ...entry.longLines.map((l, i) => (
                    <div key={i}>&nbsp;&nbsp;* {l}</div>
                  ))
                }
                <div>&nbsp;</div>
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
