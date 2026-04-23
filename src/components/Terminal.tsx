import { useState, useRef, useEffect } from "react";

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
        "asdf",
        "asdf",
        "asdf",
      ]
    },
    earnest: {
      startYear: 2014,
      endYear: 2016,
      tagLine: "I built student lending.",
      longLines: [
        "asdf",
        "asdf",
        "asdf",
      ]
    },
    quad_analytix: {
      startYear: 2013,
      endYear: 2014,
      tagLine: "I made a frontend for data entry.",
      longLines: [
        "asdf",
        "asdf",
        "asdf",
      ]
    },
    shortcircuit: {
      startYear: 2012,
      endYear: 2013,
      tagLine: "I made a public transit routing app.",
      longLines: [
        "asdf",
        "asdf",
        "asdf",
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
      return Object.entries(optionHelp).map(([cmdName, helpTxt]) =>
        `${cmdName}: ${helpTxt}`
      );
    }

    if (command == 'resume') {
      if (args.length === 0) {
        return [(
          <div>
            <div>`resume company_name` for more info.</div>
            {
              Object.entries(resumeEntries).map(([company, entry]) => 
                <div>
                  &nbsp;&nbsp;[{company}] :: ({entry.startYear}-{entry.endYear}) :: {entry.tagLine}
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
          `${arg} (${entry.startYear}-${entry.endYear}) ::`,
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
      {
        lines.map((v, idx) => 
          <div key={idx}>
            <span style={{/* color: '#aaa' */}}>{v}</span>
          </div>
        )
      }

      %&nbsp;
      <div className="autocomplete-wrapper">
        <div className="ghost-text" id="terminal-autocomplete-ghost">
          {inputVal}
          <span style={{ color: '#aaa' }}>{suggestion}</span>
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
