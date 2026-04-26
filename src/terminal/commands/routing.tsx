import { memo, useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { ReactNode } from "react";
import { colorSpan, colors } from "../colors";
import { MinHeap } from "../minheap";
import type { AppExit, Command } from "./types";

const BLOCKED = Symbol('BLOCKED');
const START = Symbol('START');

const gridSize = 20;
const cellSize = 24;
const emptyVal = '.';

type Coord = [number, number];
type VisitedValue = typeof BLOCKED | typeof START | Coord;
type Visited = Record<string, VisitedValue>;

type GridState = {
  toVisit: MinHeap;
  visited: Visited;
  path: Coord[];
  start: Coord;
  end: Coord;
  cursor: Coord;
  done: boolean;
};

type Action =
  | { type: 'TICK' }
  | { type: 'STEP' }
  | { type: 'HIGHLIGHT_STEP' }
  | { type: 'MOVE_CURSOR'; dx: number; dy: number }
  | { type: 'TOGGLE_BLOCK' }
  | { type: 'SET_START' }
  | { type: 'SET_END' }
  | { type: 'RESET' }
  | { type: 'ENTER_EDIT' };

function coordKey(c: Coord): string {
  return `${c[0]},${c[1]}`;
}

function dist(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

function cmppair([x1, y1]: Coord, [x2, y2]: Coord): boolean {
  return x1 === x2 && y1 === y2;
}

function gridNeighbors(x: number, y: number, minX: number, maxX: number, minY: number, maxY: number): Coord[] {
  const neighbors: Coord[] = [];
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

function makeInitialState(): GridState {
  const visited: Visited = {};
  for (let i = 3; i < 15; i++) {
    visited[coordKey([i, 3])] = BLOCKED;
    visited[coordKey([3, i])] = BLOCKED;
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

function reducer(state: GridState, action: Action): GridState {
  switch (action.type) {
    case 'TICK': {
      if (state.done) return state;
      if (coordKey(state.end) in state.visited) {
        return reducer(state, { type: 'HIGHLIGHT_STEP' });
      }
      return reducer(state, { type: 'STEP' });
    }
    case 'STEP': {
      const { start, end, toVisit, visited } = state;
      if (!(coordKey(start) in visited)) {
        visited[coordKey(start)] = START;
        toVisit.push(0, start);
      } else if (toVisit.size() === 0) {
        return state;
      }
      const [, curNode] = toVisit.pop() as [number, Coord];
      const neighbors = gridNeighbors(curNode[0], curNode[1], 0, gridSize - 1, 0, gridSize - 1);
      neighbors.forEach(neighbor => {
        if (coordKey(neighbor) in visited) return;
        visited[coordKey(neighbor)] = curNode;
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
      const next = path.length === 0 ? end : visited[coordKey(path.at(-1)!)] as Coord;
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
      const visited: Visited = { ...state.visited };
      const key = coordKey(state.cursor);
      if (key in visited) {
        delete visited[key];
      } else if (!cmppair(state.cursor, state.start) && !cmppair(state.cursor, state.end)) {
        visited[key] = BLOCKED;
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
      const visited: Visited = Object.fromEntries(
        Object.entries(state.visited).filter(([, v]) => v === BLOCKED)
      );
      return { ...state, path: [], visited, toVisit: new MinHeap(), done: false };
    }
  }
}

type Hotkey = {
  key: string;
  desc: string;
  visible: boolean;
  fn: () => void;
};

type Cell = ReactNode | ReactNode[];
type ContentEntry = [number, number, Cell];

function Grid({ gridState, tick, editMode, forceCursorVisible }: {
  gridState: GridState;
  tick: number;
  editMode: boolean;
  forceCursorVisible: boolean;
}) {
  const entries: ContentEntry[] = [];
  for (const [key, value] of Object.entries(gridState.visited)) {
    const [xStr, yStr] = key.split(",");
    entries.push([parseInt(xStr), parseInt(yStr), value === BLOCKED ? "█" : "o"]);
  }
  for (const [x, y] of gridState.path) {
    entries.push([x, y, colorSpan('x', colors.lightPurple)]);
  }
  entries.push([gridState.start[0], gridState.start[1], colorSpan('S', colors.purple)]);
  entries.push([gridState.end[0], gridState.end[1], colorSpan('E', colors.purple)]);

  const grid: Cell[][] = Array.from({ length: gridSize }, () => new Array(gridSize).fill(emptyVal));
  for (const [x, y, content] of entries) {
    grid[y][x] = Array.isArray(content) ? content[tick % content.length] : content;
  }

  if (editMode && (forceCursorVisible || tick % 2 === 0)) {
    grid[gridState.cursor[1]][gridState.cursor[0]] = '*';
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
        gridAutoRows: `${cellSize}px`,
        lineHeight: `${cellSize}px`,
        textAlign: "center",
      }}
    >
      {grid.flat().map((cell, idx) => (
        <span key={idx}>{cell}</span>
      ))}
    </div>
  );
}

const Hotkeys = memo(({ hotkeys }: { hotkeys: Hotkey[] }) => (
  <>
    {hotkeys.filter(h => h.visible).map(h => (
      <div style={{ color: colors.gray }} key={`hotkey-${h.key}`}>
        {colorSpan(h.key, colors.lightPurple)} to {h.desc}
      </div>
    ))}
  </>
));

function RoutingApp({ onExit }: { onExit: AppExit }) {
  const [gridState, dispatch] = useReducer(reducer, undefined, makeInitialState);
  const [paused, setPaused] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [tick, setTick] = useState(0);
  const [forceCursorVisible, setForceCursorVisible] = useState(false);
  const cursorTimeoutRef = useRef<number | null>(null);

  const flashCursor = useCallback(() => {
    setForceCursorVisible(true);
    if (cursorTimeoutRef.current !== null) {
      window.clearTimeout(cursorTimeoutRef.current);
    }
    cursorTimeoutRef.current = window.setTimeout(() => {
      setForceCursorVisible(false);
      cursorTimeoutRef.current = null;
    }, 250);
  }, []);

  useEffect(() => () => {
    if (cursorTimeoutRef.current !== null) {
      window.clearTimeout(cursorTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setTick(t => t + 1), 500);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (gridState.done) setPaused(true);
  }, [gridState.done]);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => dispatch({ type: 'TICK' }), 100);
    return () => window.clearInterval(id);
  }, [paused]);

  const hotkeys = useMemo<Hotkey[]>(() => [
    { key: 'q', desc: 'quit', visible: true, fn: () => onExit() },
    {
      key: 'r', desc: 'reset', visible: true,
      fn: () => { dispatch({ type: 'RESET' }); setPaused(false); },
    },
    {
      key: 'p', desc: paused ? 'unpause' : 'pause', visible: true,
      fn: () => setPaused(p => !p),
    },
    {
      key: 'e', desc: `${editMode ? 'exit' : 'enter'} edit mode`, visible: true,
      fn: () => {
        if (editMode) {
          setEditMode(false);
          setPaused(false);
        } else {
          dispatch({ type: 'ENTER_EDIT' });
          setEditMode(true);
          setPaused(true);
          flashCursor();
        }
      },
    },
    { key: 'arrowdown', desc: 'move down', visible: editMode, fn: () => { dispatch({ type: 'MOVE_CURSOR', dx: 0, dy: 1 }); flashCursor(); } },
    { key: 'arrowup', desc: 'move up', visible: editMode, fn: () => { dispatch({ type: 'MOVE_CURSOR', dx: 0, dy: -1 }); flashCursor(); } },
    { key: 'arrowleft', desc: 'move left', visible: editMode, fn: () => { dispatch({ type: 'MOVE_CURSOR', dx: -1, dy: 0 }); flashCursor(); } },
    { key: 'arrowright', desc: 'move right', visible: editMode, fn: () => { dispatch({ type: 'MOVE_CURSOR', dx: 1, dy: 0 }); flashCursor(); } },
    { key: 's', desc: 'set the start location', visible: editMode, fn: () => dispatch({ type: 'SET_START' }) },
    { key: 'd', desc: 'set the end location', visible: editMode, fn: () => dispatch({ type: 'SET_END' }) },
    { key: 'a', desc: 'toggle between blocked and unblocked', visible: editMode, fn: () => dispatch({ type: 'TOGGLE_BLOCK' }) },
  ], [onExit, editMode, paused, flashCursor]);

  useEffect(() => {
    const handlerMap = new Map(hotkeys.map(h => [h.key, h]));
    const onKey = (e: KeyboardEvent) => {
      const handler = handlerMap.get(e.key.toLowerCase());
      if (handler) {
        e.preventDefault();
        handler.fn();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hotkeys]);

  return (
    <div className="terminal-app">
      <div style={{ color: colors.background, backgroundColor: colors.foreground }}>
        Routing
      </div>
      <div>&nbsp;</div>

      <Grid
        gridState={gridState}
        tick={tick}
        editMode={editMode}
        forceCursorVisible={forceCursorVisible}
      />

      <div>&nbsp;</div>

      <Hotkeys hotkeys={hotkeys} />
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
