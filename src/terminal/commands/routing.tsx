import { memo, useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { ReactNode } from "react";
import { colorSpan, colors } from "../colors";
import { MinHeap } from "../minheap";
import type { AppExit, Command } from "./types";
import { type Coord, dist, eq as coordsEq, inBounds as coordInBounds } from "../geometry";

const gridSize = 20;
const cellSize = '2.5ch';
const emptyVal = '·';
const lowInterval = 200;
const medInterval = 100;
const highInterval = 50;

type CellType = 'EMPTY' | 'BLOCKED';

type SearchCell = {
  pred: Coord | null;
  dist: number;
  visited: boolean;
  closed: boolean;
};

class Grid {
  readonly size: number;
  start: Coord;
  end: Coord;
  cursor: Coord;
  private types: CellType[][];

  constructor(size: number, start: Coord, end: Coord) {
    this.size = size;
    this.start = start;
    this.end = end;
    this.cursor = [start[0], start[1]];
    this.types = Array.from({ length: size }, () =>
      new Array<CellType>(size).fill('EMPTY'),
    );
  }

  inBounds(c: Coord): boolean {
    return coordInBounds(c, this.size);
  }

  getType([x, y]: Coord): CellType {
    return this.types[y][x];
  }

  setType([x, y]: Coord, type: CellType): void {
    this.types[y][x] = type;
  }

  isBlocked(c: Coord): boolean {
    return this.getType(c) === 'BLOCKED';
  }

  toggleBlock(c: Coord): void {
    if (this.isBlocked(c)) {
      this.setType(c, 'EMPTY');
    } else if (!coordsEq(c, this.start) && !coordsEq(c, this.end)) {
      this.setType(c, 'BLOCKED');
    }
  }

  moveCursor(dx: number, dy: number): void {
    this.cursor = [
      (this.cursor[0] + dx + this.size) % this.size,
      (this.cursor[1] + dy + this.size) % this.size,
    ];
  }

  neighbors([x, y]: Coord): Coord[] {
    const candidates: Coord[] = [
      [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1],
      [x - 1, y - 1], [x - 1, y + 1], [x + 1, y + 1], [x + 1, y - 1],
    ];
    return candidates.filter(c => this.inBounds(c));
  }

  forEachBlocked(fn: (c: Coord) => void): void {
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (this.types[y][x] === 'BLOCKED') fn([x, y]);
      }
    }
  }

  clone(): Grid {
    const g = new Grid(this.size, [this.start[0], this.start[1]], [this.end[0], this.end[1]]);
    g.cursor = [this.cursor[0], this.cursor[1]];
    g.types = this.types.map(row => row.slice());
    return g;
  }
}

class Pathfinder {
  readonly size: number;
  toVisit: MinHeap<Coord>;
  path: Coord[];
  done: boolean;
  private cells: SearchCell[][];

  constructor(size: number) {
    this.size = size;
    this.toVisit = new MinHeap<Coord>();
    this.path = [];
    this.done = false;
    this.cells = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => ({ pred: null, dist: 0, visited: false, closed: false })),
    );
  }

  get([x, y]: Coord): SearchCell {
    return this.cells[y][x];
  }

  isVisited(c: Coord): boolean {
    return this.get(c).visited;
  }

  isClosed(c: Coord): boolean {
    return this.get(c).closed;
  }

  visit(c: Coord, pred: Coord | null, distance: number): void {
    const cell = this.cells[c[1]][c[0]];
    cell.visited = true;
    cell.pred = pred;
    cell.dist = distance;
  }

  close(c: Coord): void {
    this.cells[c[1]][c[0]].closed = true;
  }

  forEachVisited(fn: (c: Coord, cell: SearchCell) => void): void {
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        const cell = this.cells[y][x];
        if (cell.visited) fn([x, y], cell);
      }
    }
  }

  clone(): Pathfinder {
    const p = new Pathfinder(this.size);
    p.toVisit = this.toVisit.clone();
    p.path = this.path.slice();
    p.done = this.done;
    p.cells = this.cells.map(row => row.map(c => ({ ...c })));
    return p;
  }
}

type GridState = {
  grid: Grid;
  search: Pathfinder;
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
  | { type: 'RESTART' }
  | { type: 'ENTER_EDIT' };

// S = start, E = end, # = blocked, . = empty. One row per line, one char per cell.
const initialLayout = [
  '....##..............',
  '....................',
  '...###...#..........',
  '.........##.........',
  '..####........#####.',
  '.........##.........',
  '.#####...##...######',
  '.........##...#.....',
  '######........#..E..',
  '.....#...##...#.....',
  '..S..#........#####.',
  '.....#...##.........',
  '.#####...##...#####.',
  '.........##.........',
  '.#####........####..',
  '.........##..........',
  '..........#...###...',
  '....................',
  '..............##....',
  '....................',
];

function makeInitialState(): GridState {
  let start: Coord = [0, 0];
  let end: Coord = [0, 0];
  const blocks: Coord[] = [];
  for (let y = 0; y < initialLayout.length; y++) {
    for (let x = 0; x < initialLayout[y].length; x++) {
      const ch = initialLayout[y][x];
      if (ch === 'S') start = [x, y];
      else if (ch === 'E') end = [x, y];
      else if (ch === '#') blocks.push([x, y]);
    }
  }
  const grid = new Grid(gridSize, start, end);
  blocks.forEach(c => grid.setType(c, 'BLOCKED'));
  return { grid, search: new Pathfinder(gridSize) };
}

function reducer(state: GridState, action: Action): GridState {
  switch (action.type) {
    case 'TICK': {
      if (state.search.done) return state;
      if (state.search.isVisited(state.grid.end)) {
        return reducer(state, { type: 'HIGHLIGHT_STEP' });
      }
      return reducer(state, { type: 'STEP' });
    }
    case 'STEP': {
      const { grid } = state;
      const { start, end } = grid;
      const search = state.search.clone();

      if (!search.isVisited(start)) {
        search.visit(start, null, 0);
        search.toVisit.push(dist(start, end), start);
      } else if (search.toVisit.size() === 0) {
        return state;
      }
      // we need to pop until we find something not in the closed set
      let curNode: Coord | null = null;
      while (search.toVisit.size() > 0) {
        const popped = search.toVisit.pop();
        if (!popped) return state;

        const [, candidate] = popped;
        if (!search.isClosed(candidate)) {
          curNode = candidate;
          break;
        }
      }
      if (!curNode) return state;

      search.close(curNode);
      const curDist = search.get(curNode).dist;

      for (const neighbor of grid.neighbors(curNode)) {
        if (search.isClosed(neighbor)) continue;
        if (grid.isBlocked(neighbor)) continue;

        const arcLen = dist(neighbor, curNode);
        const newDist = curDist + arcLen;
        const ncell = search.get(neighbor);
        if (!ncell.visited || newDist < ncell.dist) {
          search.visit(neighbor, curNode, newDist);
          search.toVisit.push(newDist + dist(neighbor, end), neighbor);
        }
      }
      return { ...state, search };
    }
    case 'HIGHLIGHT_STEP': {
      const { grid } = state;
      const search = state.search.clone();
      const last = search.path.at(-1);
      if (last && coordsEq(last, grid.start)) {
        search.done = true;
        return { ...state, search };
      }
      const next = last ? search.get(last).pred as Coord : grid.end;
      search.path = [...search.path, next];
      return { ...state, search };
    }
    case 'MOVE_CURSOR': {
      const grid = state.grid.clone();
      grid.moveCursor(action.dx, action.dy);
      return { ...state, grid };
    }
    case 'TOGGLE_BLOCK': {
      const grid = state.grid.clone();
      grid.toggleBlock(grid.cursor);
      return { ...state, grid };
    }
    case 'SET_START': {
      const grid = state.grid.clone();
      grid.start = [grid.cursor[0], grid.cursor[1]];
      return { ...state, grid };
    }
    case 'SET_END': {
      const grid = state.grid.clone();
      grid.end = [grid.cursor[0], grid.cursor[1]];
      return { ...state, grid };
    }
    case 'RESTART':
      return { ...state, search: new Pathfinder(state.grid.size) };
    case 'RESET':
      return makeInitialState();
    case 'ENTER_EDIT':
      return { ...state, search: new Pathfinder(state.grid.size) };
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

function GridView({ state, tick, editMode, forceCursorVisible }: {
  state: GridState;
  tick: number;
  editMode: boolean;
  forceCursorVisible: boolean;
}) {
  const { grid, search } = state;
  const entries: ContentEntry[] = [];

  grid.forEachBlocked(([x, y]) => entries.push([x, y, "█"]));
  search.forEachVisited(([x, y], cell) => {
    entries.push([x, y, cell.closed ? "o" : ","]);
  });
  for (const [x, y] of search.path) {
    entries.push([x, y, colorSpan('x', colors.lightPurple)]);
  }
  entries.push([grid.start[0], grid.start[1], colorSpan('S', colors.purple)]);
  entries.push([grid.end[0], grid.end[1], colorSpan('E', colors.purple)]);

  const cells: Cell[][] = Array.from({ length: grid.size }, () => new Array(grid.size).fill(emptyVal));
  for (const [x, y, content] of entries) {
    cells[y][x] = Array.isArray(content) ? content[tick % content.length] : content;
  }

  if (editMode && (forceCursorVisible || tick % 2 === 0)) {
    cells[grid.cursor[1]][grid.cursor[0]] = '*';
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${grid.size}, ${cellSize})`,
        gridAutoRows: cellSize,
        lineHeight: cellSize,
        textAlign: "center",
      }}
    >
      {cells.flat().map((cell, idx) => (
        <span key={idx}>{cell}</span>
      ))}
    </div>
  );
}

function MetadataBox({ state, paused, editMode, speed }: {
  state: GridState;
  paused: boolean;
  editMode: boolean;
  speed: number;
}) {
  const { grid, search } = state;
  let visited = 0;
  let closed = 0;
  search.forEachVisited((_, cell) => {
    visited++;
    if (cell.closed) closed++;
  });
  const status = editMode
    ? 'edit'
    : search.done ? 'done' : paused ? 'paused' : 'running';
  const fmtCoord = ([x, y]: Coord) =>
    `(${x.toString().padStart(2)}, ${y.toString().padStart(2)})`;

  const W = 30;
  const INNER = W - 4;
  const horiz = '─'.repeat(W - 2);

  function row(label: string, value: string) {
    const labelPart = label.padEnd(7);
    const text = `${labelPart} :: ${value}`;
    const pad = ' '.repeat(Math.max(0, INNER - text.length));
    return (
      <div>│ {colorSpan(labelPart, colors.gray)} :: {value}{pad} │</div>
    );
  }

  const padding = <div>{' '.repeat(W)}</div>
  const blank = <div>│{' '.repeat(W - 2)}│</div>;

  const speedMarker = '▲';
  const sliderArr = Array.from({ length: W - 4 }, () => '-');
  if (speed === medInterval) {
    sliderArr[13] = speedMarker;
  } else if (speed === lowInterval) {
    sliderArr[0] = speedMarker;
  } else {
    sliderArr[25] = speedMarker;
  }

  const speedSlider = <div>│ {sliderArr.join('')} │</div>;

  return (
    <div style={{ whiteSpace: 'pre' }}>
      {padding}
      <div>┌{horiz}┐</div>
      {row('status', status)}
      {row('start', fmtCoord(grid.start))}
      {row('end', fmtCoord(grid.end))}
      {blank}
      {row('closed', closed.toString())}
      {row('open', search.toVisit.size().toString())}
      {row('path', search.path.length.toString())}
      {blank}
      <div>│Speed                       │</div>
      {speedSlider}
      <div>│ Low         Med         Hi │</div>
      {blank}
      {blank}
      {blank}
      <div>└{horiz}┘</div>
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
  const [pathfinderInterval, setPathfindingInterval] = useState(medInterval);

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
    if (gridState.search.done) setPaused(true);
  }, [gridState.search.done]);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => dispatch({ type: 'TICK' }), pathfinderInterval);
    return () => window.clearInterval(id);
  }, [paused, pathfinderInterval]);

  const hotkeys = useMemo<Hotkey[]>(() => [
    { key: 'q', desc: 'quit', visible: true, fn: () => onExit() },
    {
      key: 'r', desc: 'restart', visible: true,
      fn: () => { dispatch({ type: 'RESTART' }); setPaused(false); setEditMode(false); },
    },
    {
      key: 't', desc: 'reset', visible: true,
      fn: () => { dispatch({ type: 'RESET' }); setPaused(false); setEditMode(false); },
    },
    {
      key: 'p', desc: paused ? 'unpause' : 'pause', visible: true,
      fn: () => {
        setEditMode(false);
        setPaused(p => !p)
      },
    },
    {
      key: 'o', 
      desc: 'change animation speed',
      visible: true,
      fn: () => {
        if (pathfinderInterval === medInterval) {
          setPathfindingInterval(highInterval);
        } else if (pathfinderInterval === lowInterval) {
          setPathfindingInterval(medInterval);
        } else {
          setPathfindingInterval(lowInterval);
        }
      }
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
    { key: 'b', desc: 'toggle between blocked and unblocked', visible: editMode, fn: () => dispatch({ type: 'TOGGLE_BLOCK' }) },
  ], [onExit, editMode, paused, flashCursor, pathfinderInterval]);

  useEffect(() => {
    const handlerMap = new Map(hotkeys.map(h => [h.key, h]));
    const onKey = (e: KeyboardEvent) => {
      const handler = handlerMap.get(e.key) ?? handlerMap.get(e.key.toLowerCase());
      if (handler) {
        e.preventDefault();
        handler.fn();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hotkeys]);

  return (
    <>
      <div style={{ color: colors.background, backgroundColor: colors.foreground }}>
        Routing
      </div>
      <div>&nbsp;</div>

      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        <GridView
          state={gridState}
          tick={tick}
          editMode={editMode}
          forceCursorVisible={forceCursorVisible}
        />
        <MetadataBox
          state={gridState}
          paused={paused}
          editMode={editMode}
          speed={pathfinderInterval}
        />
      </div>

      <div>&nbsp;</div>

      <Hotkeys hotkeys={hotkeys} />
    </>
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
