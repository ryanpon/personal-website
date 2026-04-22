import { useState } from "react";

export default function Terminal() {
  const autocompleteOptions = [
    "help",
    "resume",
  ];
  function getMatch(value) {
    if (!value) return 'help';
    return autocompleteOptions.find(s => s.toLowerCase().startsWith(value.toLowerCase())) ?? null;
  }

  const [inputVal, setInput] = useState('');
  const match = getMatch(inputVal);
  const suggestion = match ? match.slice(inputVal.length) : '';

  function handleKeyDown(e) {
    if ((e.key === 'Tab' || e.key === 'ArrowRight') && suggestion) {
      e.preventDefault();
      console.log(suggestion);
      setInput(suggestion);
    }
  }

  return (
    <div>
      %&nbsp;
      <div className="autocomplete-wrapper">
        <div className="ghost-text" id="ghost">
          {inputVal}
          <span style={{ color: '#aaa' }}>{suggestion}</span>
        </div>
        <input 
          type="text" 
          id="input"
          value={inputVal} 
          onChange={e => setInput(e.target.value)} 
          onKeyDown={handleKeyDown}
          autoFocus
        />
      </div>
    </div>
  );
}
