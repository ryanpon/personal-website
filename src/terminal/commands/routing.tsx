import { useEffect, useState } from "react";
import { colorSpan, colors } from "../colors";
import type { AppExit, Command } from "./types";

class MinHeap {
  constructor() {
    this.heap = [];
  }

  push(key, val) {
    this.heap.push([key, val]);
    this._bubbleUp(this.heap.length - 1);
  }

  pop() {
    const min = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this._sinkDown(0);
    }
    return min;
  }

  peek() {
    return this.heap[0];
  }

  size() {
    return this.heap.length;
  }

  _bubbleUp(i) {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.heap[parent][0] <= this.heap[i][0]) break;
      [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
      i = parent;
    }
  }

  _sinkDown(i) {
    const n = this.heap.length;
    while (true) {
      let smallest = i;
      const l = 2 * i + 1, r = 2 * i + 2;
      if (l < n && this.heap[l][0] < this.heap[smallest][0]) smallest = l;
      if (r < n && this.heap[r][0] < this.heap[smallest][0]) smallest = r;
      if (smallest === i) break;
      [this.heap[smallest], this.heap[i]] = [this.heap[i], this.heap[smallest]];
      i = smallest;
    }
  }
}

function pad(s: string | number, width: number, right = false) {
  const str = String(s);
  if (str.length >= width) return str.slice(0, width);
  const fill = " ".repeat(width - str.length);
  return right ? str + fill : fill + str;
}

function dist(x1, y1, x2, y2) {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
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

function RoutingApp({ onExit }: { onExit: AppExit }) {
  const arraySize = 20;

  function renderGrid(contentEntries, emptyVal = '.') {
    const initialGrid = Array.from({ length: arraySize }, () => new Array(arraySize).fill(emptyVal));
    contentEntries.forEach(([x, y, content]) => {
      initialGrid[y][x] = content;
    });
    return initialGrid;
  }

  const initialState = {
    grid: renderGrid([]),
    toVisit: new MinHeap(),
    visited: {},
    path: [],
    start: [0, 0],
    end: [10, 10]
  };

  const [gridState, setGridState] = useState(initialState);

  useEffect(() => {
    const refresh = () => {
      function runRouting(prev) {
        const {grid, start, end, toVisit, visited, ...rest} = prev;
        if (Object.keys(visited).length === 0) {
          toVisit.push(0, start);
        }
        const [_, curNode] = toVisit.pop();
        const neighbors = gridNeighbors(curNode[0], curNode[1], 0, 19, 0, 19);
        neighbors.forEach(neighbor => {
          if (neighbor in visited) return;

          const [nX, nY] = neighbor;
          visited[neighbor] = curNode;
          toVisit.push(dist(nX, nY, end[0], end[1]), neighbor)
        });

        const gridContent = Object.keys(visited).map(key => {
          const [xStr, yStr] = key.split(',');
          return [parseInt(xStr), parseInt(yStr), "o"];
        });
        return {
          grid: renderGrid(gridContent),
          start, 
          end, 
          toVisit, 
          visited,
          ...rest
        };
      }

      function runRouteHighlight(prev) {
        const {path, grid, start, end, toVisit, visited, ...rest} = prev;
        if (path.at(-1) === start) {
          return prev; // done
        }

        const initialGridContent = Object.keys(visited).map(key => {
          const [xStr, yStr] = key.split(',');
          return [parseInt(xStr), parseInt(yStr), "o"];
        });

        if (path.length === 0) {
          path.push(end);
        } else {
          path.push(visited[path.at(-1)]);
        }
        const pathContent = path.map(([x, y]) => [x, y, 'x']);
        return {...prev, grid: renderGrid([...initialGridContent, ...pathContent]), path};
      }

      setGridState(prev => {
        const {end, toVisit, visited, ...rest} = prev;
        if (end in visited) {
          return runRouteHighlight(prev); // done
        } 

        return runRouting(prev);
      });

    };
    const id = window.setInterval(refresh, 100);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "q" || e.key === "Q") {
        e.preventDefault();
        onExit();
      }

      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        useState(initialState);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onExit]);

  return (
    <div className="terminal-app">
      <div style={{ color: colors.background, backgroundColor: colors.foreground }}>
        Routing
      </div>
      <div>&nbsp;</div>
      
      {
        gridState.grid.map((row, rowIdx) => (
          <div key={`row${rowIdx}`}>
            {
              row.map((col, colIdx) => (<span key={`row${rowIdx}col${colIdx}`}>&nbsp;{col}</span>))
            }
          </div>
        ))
      }

      <div>&nbsp;</div>
      <div style={{ color: colors.gray }}>
        Press {colorSpan("q", colors.lightPurple)} or{" "}
        {colorSpan("Ctrl+C", colors.lightPurple)} to quit,{" "}
        {colorSpan("r", colors.lightPurple)} to restart.
      </div>
    </div>
  );
}

export const routingCommand: Command = {
  name: "routing",
  help: "Visualize a greedy grid pathfinding search.",
  run: () => ({
    kind: "app",
    app: { name: "routing", Component: RoutingApp },
  }),
};
