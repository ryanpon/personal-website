export type ResumeEntry = {
  startYear: number;
  endYear: number;
  tagLine: string;
  longLines: string[];
};

export const resumeEntries: Record<string, ResumeEntry> = {
  block: {
    startYear: 2016,
    endYear: 2026,
    tagLine: "I built merchant lending.",
    longLines: [
      "Tech lead for Square Loans 2021-2026; senior engineer from 2016.",
      "",
      "Led platform engineering across 6 teams. The program originated billions",
      "a year and the platform processed several million payments a day.",
      "",
      "Architected the delinquency system — a past-due and billing engine that",
      "unblocked FDIC certification for Square's industrial bank. Has processed",
      "10B events over 5 years with zero accuracy issues.",
      "",
      "Led Modernize Credit: a type-validated config DSL and lockfile framework",
      "unifying 250 configs across 20 credit products. Servicing onboarding",
      "dropped from 16+ weeks to 2 weeks per new product.",
      "",
      "Led a 2-year credit card servicing vendor integration across 4 teams —",
      "the first decoupling of loan servicing from the lending monolith.",
      "Designed the API gateway and payment processing layer.",
      "",
      "Shipped PPP loan servicing and the SBA integration in 6 weeks.",
      "",
      "Spent a lot of time on MySQL and job queue performance across the org.",
      "Introduced message quarantining, staggered scheduling, and an",
      "operational review process to stay ahead of saturation. Mentored a few",
      "engineers into senior roles.",
    ],
  },
  earnest: {
    startYear: 2014,
    endYear: 2016,
    tagLine: "I built student lending.",
    longLines: [
      "Software engineer at Earnest, a student loan refinancer. Joined at ~4",
      "engineers; helped scale to 40+ as we grew into the second-largest",
      "refinancer in the country.",
      "",
      "Built core platform pieces: loan servicing, a distributed task queue on",
      "SQS, and the auth/ACL layer.",
      "",
      "Set up the company's first code review, test coverage, linting, and CI",
      "practices. Designed the tech interview process we used to hire most of",
      "engineering.",
      "",
      "Did security work on the side: pen testing, security reviews, and",
      "patching a handful of critical vulnerabilities.",
    ],
  },
  quad_analytix: {
    startYear: 2013,
    endYear: 2014,
    tagLine: "I made a frontend for data entry.",
    longLines: [
      "Frontend engineer on a data entry platform (AngularJS, jQuery, Java).",
      "",
      "Led the migration of the legacy jQuery UI to AngularJS and owned most",
      "of the frontend: internal tools, crowdsourcing tools, and the main",
      "enterprise app.",
      "",
      "Redesigned the data entry UX to show form fields next to a capture of",
      "the source page, so operators stopped tab-switching. Throughput on the",
      "data entry team more than doubled.",
    ],
  },
  shortcircuit: {
    startYear: 2012,
    endYear: 2013,
    tagLine: "I made a public transit routing app.",
    longLines: [
      "Backend engineer on Rover, a realtime public transit routing app with",
      "100K users (Python/Flask on Heroku).",
      "",
      "Built the realtime routing backend. Ported the graph preprocessing",
      "pipeline from Python to Go, which shaved about half an hour off our",
      "build times.",
    ],
  },
};
