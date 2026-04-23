import { useState, useRef, useEffect } from "react";

const colors = {
  background: "#272822",
  foreground: "#f8f8f2",
  gray: "#75715e",
  yellow: "#e6db74",
  purple: "#ae81ff",
  lightPurple: "#d3bdf9",
  pink: "#f92672",
  green: "#a6e22e",
  cyan: "#66d9ef",
};

function colorSpan(text, color) {
  return (<span style={{ color }}>{text}</span>)
}

export default function Terminal() {
  const autocompleteOptions = [
    "help",
    "resume",
  ];
  const optionHelp = {
    help: "Get this help text.",
    resume: "See Ryan's resume."
  };
  const resumeEntries = {
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
      ]
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
      ]
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
      ]
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
      ]
    },
  };
  
  // TODO: autocomplete for command args
  function getMatch(value) {
    if (!value) {
      return lines.length === 0 ? 'help' : '';
    }
    return autocompleteOptions.find(s => s.toLowerCase().startsWith(value.toLowerCase())) ?? null;
  }

  const [lines, setLines] = useState([]);
  const [commands, setCommands] = useState([]);
  const [inputVal, setInput] = useState('');
  const [scrollbackVal, setScrollback] = useState(null);
  const match = getMatch(inputVal);
  const suggestion = match ? match.slice(inputVal.length) : '';
  const bottomRef = useRef(null);
  
  // History
  //   Ctrl+R — incremental backward search through history
  //   !! — repeat last command
  //   !$ — last argument of previous command
  //   !^ — first argument of previous command
  //   !:n — nth argument of previous command
  //   !string — run last command starting with "string"
  // 
  // Editing
  //   Ctrl+A / Ctrl+E — jump to start/end of line
  //   Ctrl+W — delete word backward
  //   Alt+D — delete word forward
  //   Ctrl+K — kill to end of line
  //   Ctrl+U — kill to beginning of line
  //   Ctrl+Y — yank (paste) killed text
  //   Alt+. — insert last argument of previous command (repeatable!)
  // 
  // Autocomplete
  //   Ctrl+X Ctrl+H — show all completion helpers for current context
  function handleKeyDown(e) {
    if (e.key === 'ArrowUp' && commands.length > 0) {
      e.preventDefault();
      const newScrollbackVal = Math.max((scrollbackVal === null ? commands.length : scrollbackVal) - 1, 0);
      setInput(commands[newScrollbackVal]);
      setScrollback(newScrollbackVal);
    }
    if (e.key === 'ArrowDown' && scrollbackVal !== null && scrollbackVal < commands.length) {
      e.preventDefault();
      const newScrollbackVal = Math.min(scrollbackVal + 1, commands.length - 1);
      setInput(commands[newScrollbackVal]);
      setScrollback(newScrollbackVal);
    }
    if ((e.key === 'Tab' || e.key === 'ArrowRight') && suggestion) {
      e.preventDefault();
      setInput(match);
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const command = `% ${inputVal}`;
      const outputLines = dispatchCommand(inputVal);
      setScrollback(null);
      setLines(prev => [...prev, command, ...outputLines]);
      setCommands(prev => [...prev, inputVal])
      setInput('');

      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 0);
    }
  }

  function dispatchCommand(inputStr) {
    const [command, ...args] = inputStr.split(' ');

    if (!command){
      return [''];
    }

    if (command == 'help') {
      return [
        "Available commands:",
        ...Object.entries(optionHelp).map(([cmdName, helpTxt]) =>
          (<span>&nbsp;&nbsp;{colorSpan(cmdName, colors.purple)} – {helpTxt}</span>)
        )
      ];
    }

    if (command == 'resume') {
      if (args.length === 0) {
        return [(
          <div>
            <div>`resume {colorSpan('company_name', colors.lightPurple)}` for more info.</div>
            {
              Object.entries(resumeEntries).map(([company, entry]) => 
                <div>
                  &nbsp;&nbsp;[{colorSpan(company, colors.purple)}] :: {entry.startYear}-{entry.endYear} :: {entry.tagLine}
                </div>
              )
            }
          </div>
        )];
      }

      return args.map(arg => {
        const entry =  resumeEntries[arg];
        if (!entry) {
          return [`resume: company not found: ${arg}`];
        }

        return [
          `${arg} :: ${entry.startYear}-${entry.endYear} ::`,
          ...entry.longLines.map(l => <span>&nbsp;&nbsp;{l}</span>)
        ];
      }).flat();
    } 

    return [`command not found: ${command}`];
  }

  const inputRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setLines(_ => []);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const refocus = () => {
      if (window.getSelection()?.toString()) return;
      inputRef.current?.focus();
    };

    document.addEventListener('mouseup', refocus);
    return () => document.removeEventListener('mouseup', refocus);
  }, []);

  return (
    <div>
      { lines.map((line, idx) => <div key={idx}>{line}</div>) }

      <span style={{color: colors.lightPurple}}>%&nbsp;</span>
      <div className="autocomplete-wrapper">
        <div className="ghost-text" id="terminal-autocomplete-ghost">
          {inputVal}
          {colorSpan(suggestion, colors.gray)}
        </div>
        <input
          type="text"
          id="terminal-input"
          ref={inputRef}
          value={inputVal}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      </div>
      <div ref={bottomRef} />
    </div>
  );
}
