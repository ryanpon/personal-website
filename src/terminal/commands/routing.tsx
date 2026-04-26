import { useEffect, useReducer, useState } from "react";
import { colorSpan, colors } from "../colors";
import { MinHeap } from "../minheap";
import type { AppExit, Command } from "./types";

const BLOCKED = Symbol('BLOCKED');
const START = Symbol('START');

const gridSize = 20;

function dist(x1, y1, x2, y2) {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

function cmppair([x1, y1], [x2, y2]) {
  return x1 === x2 && y1 === y2;
}

function gridNeighbors(x, y, minX, maxX, minY, maxY) {
  const neighbors = [];
  if (x > minX) {
    neighbors.push([x - 1, y]);
  }
  if (x < maxX) {
    neighbors.push([x + 1, y]);
  }
  if (y > minY) {
    neighbors.push([x, y - 1]);
  }
  if (y < maxY) {
    neighbors.push([x, y + 1]);
  }
  return neighbors;
}

function makeInitialState() {
  const visited = {};
  for (let i = 3; i < 15; i++) {
    visited[[i, 3]] = BLOCKED;
    visited[[3, i]] = BLOCKED;
  }
  return {
    toVisit: new MinHeap(),
    visited,
    path: [],
    start: [0, 0],
    end: [10, 10],
    cursor: [0, 0],
    done: false,
  };
}

function reducer(state, action) {
  switch (action.type) {
    case 'TICK': {
      if (state.done) return state;
      if (state.end in state.visited) {
        return reducer(state, { type: 'HIGHLIGHT_STEP' });
      }
      return reducer(state, { type: 'STEP' });
    }
    case 'STEP': {
      const { start, end, toVisit, visited } = state;
      if (!(start in visited)) {
        visited[start] = START;
        toVisit.push(0, start);
      } else if (toVisit.size() === 0) {
        return state;
      }
      const [, curNode] = toVisit.pop();
      const neighbors = gridNeighbors(curNode[0], curNode[1], 0, gridSize - 1, 0, gridSize - 1);
      neighbors.forEach(neighbor => {
        if (neighbor in visited) return;
        visited[neighbor] = curNode;
        toVisit.push(dist(neighbor[0], neighbor[1], end[0], end[1]), neighbor);
      });
      return { ...state };
    }
    case 'HIGHLIGHT_STEP': {
      const { path, start, end, visited } = state;
      const last = path.at(-1);
      if (last && cmppair(last, start)) {
        return { ...state, done: true };
      }
      const next = path.length === 0 ? end : visited[path.at(-1)];
      return { ...state, path: [...path, next] };
    }
    case 'MOVE_CURSOR': {
      const [cx, cy] = state.cursor;
      return {
        ...state,
        cursor: [
          (cx + action.dx + gridSize) % gridSize,
          (cy + action.dy + gridSize) % gridSize,
        ],
      };
    }
    case 'TOGGLE_BLOCK': {
      const visited = { ...state.visited };
      if (state.cursor in visited) {
        delete visited[state.cursor];
      } else if (!cmppair(state.cursor, state.start) && !cmppair(state.cursor, state.end)) {
        visited[state.cursor] = BLOCKED;
      }
      return { ...state, visited };
    }
    case 'SET_START':
      return { ...state, start: [...state.cursor] };
    case 'SET_END':
      return { ...state, end: [...state.cursor] };
    case 'RESET':
      return makeInitialState();
    case 'ENTER_EDIT': {
      const visited = Object.fromEntries(
        Object.entries(state.visited).filter(([, v]) => v === BLOCKED)
      );
      return { ...state, path: [], visited, toVisit: new MinHeap(), done: false };
    }
    default:
      return state;
  }
}

function RoutingApp({ onExit }: { onExit: AppExit }) {
  const cellSize = 24;
  const emptyVal = '.';

  const [gridState, dispatch] = useReducer(reducer, undefined, makeInitialState);
  const [paused, setPaused] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [tick, setTick] = useState(0);
  const [lastCursorMove, setLastCursorMove] = useState(Date.now());

  function renderGrid() {
    const visitedContent = Object.entries(gridState.visited).map(([key, value]) => {
      const [xStr, yStr] = key.split(",");
      const content = value === BLOCKED ? "█" : "o";
      return [parseInt(xStr), parseInt(yStr), content];
    });
    const pathContent = gridState.path.map(([x, y]) =>
      [x, y, colorSpan('x', colors.lightPurple)]
    );
    const startContent = [...gridState.start, colorSpan('S', colors.purple)];
    const endContent = [...gridState.end, colorSpan('E', colors.purple)];
    const contentEntries = [
      ...visitedContent,
      ...pathContent,
      startContent,
      endContent
    ];

    const grid = Array.from({ length: gridSize }, () => new Array(gridSize).fill(emptyVal));
    contentEntries.forEach(([x, y, content]) => {
      grid[y][x] = Array.isArray(content) ? content[tick % content.length] : content;
    });

    if (editMode) {
      const recentlyMoved = Date.now() - lastCursorMove < 250;
      if (recentlyMoved || tick % 2 === 0) {
        grid[gridState.cursor[1]][gridState.cursor[0]] = '*';
      }
    }

    return grid;
  }

  function enterEditMode() {
    dispatch({ type: 'ENTER_EDIT' });
    setEditMode(true);
    setPaused(true);
  }

  function exitEditMode() {
    setEditMode(false);
    setPaused(false);
  }

  useEffect(() => {
    const id = window.setInterval(() => setTick(t => t + 1), 500);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    setLastCursorMove(Date.now());
  }, [gridState.cursor[0], gridState.cursor[1], editMode]);

  useEffect(() => {
    if (gridState.done) setPaused(true);
  }, [gridState.done]);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => dispatch({ type: 'TICK' }), 100);
    return () => window.clearInterval(id);
  }, [paused]);

  const keypressHandlers = {
    q: {
      desc: () => 'quit',
      visibile: () => true,
      fn: () => onExit(),
    },
    r: {
      desc: () => 'reset',
      visibile: () => true,
      fn: () => {
        dispatch({ type: 'RESET' });
        setPaused(false);
      },
    },
    p: {
      desc: () => paused ? 'unpause' : 'pause',
      visibile: () => true,
      fn: () => setPaused(prev => !prev)
    },
    e: {
      desc: () => `${editMode ? 'exit' : 'enter'} edit mode`,
      visible: () => true,
      fn: () => editMode ? exitEditMode() : enterEditMode()
    },
    arrowdown: {
      desc: () => 'move down',
      visible: () => editMode,
      fn: () => dispatch({ type: 'MOVE_CURSOR', dx: 0, dy: 1 }),
    },
    arrowup: {
      desc: () => 'move up',
      visible: () => editMode,
      fn: () => dispatch({ type: 'MOVE_CURSOR', dx: 0, dy: -1 }),
    },
    arrowleft: {
      desc: () => 'move left',
      visible: () => editMode,
      fn: () => dispatch({ type: 'MOVE_CURSOR', dx: -1, dy: 0 }),
    },
    arrowright: {
      desc: () => 'move right',
      visible: () => editMode,
      fn: () => dispatch({ type: 'MOVE_CURSOR', dx: 1, dy: 0 }),
    },
    s: {
      desc: () => 'set the start locaton',
      visible: () => editMode,
      fn: () => dispatch({ type: 'SET_START' }),
    },
    d: {
      desc: () => 'set the end locaton',
      visible: () => editMode,
      fn: () => dispatch({ type: 'SET_END' }),
    },
    a: {
      desc: () => 'toggle between blocked and unblocked',
      visible: () => editMode,
      fn: () => dispatch({ type: 'TOGGLE_BLOCK' }),
    },

  };
  function renderHotkeys() {
    return Object.entries(keypressHandlers).map(([key, {desc}]) => (
      <div style={{ color: colors.gray }} key={`hotkey-${key}`}>
        {colorSpan(key, colors.lightPurple)} to {desc()}
      </div>
    ))
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const handler = keypressHandlers[key];
      if (handler) {
        e.preventDefault();
        handler.fn(e);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onExit, editMode, paused]);

  return (
    <div className="terminal-app">
      <div style={{ color: colors.background, backgroundColor: colors.foreground }}>
        Routing
      </div>
      <div>&nbsp;</div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
          gridAutoRows: `${cellSize}px`,
          lineHeight: `${cellSize}px`,
          textAlign: "center",
        }}
      >
        {renderGrid().flat().map((cell, idx) => (
          <span key={idx}>{cell}</span>
        ))}
      </div>

      <div>&nbsp;</div>

      {renderHotkeys()}
    </div>
  );
}

export const routingCommand: Command = {
  name: "routing",
  help: "An animated pathfinding algorithm!",
  run: () => ({
    kind: "app",
    app: { name: "routing", Component: RoutingApp },
  }),
};
