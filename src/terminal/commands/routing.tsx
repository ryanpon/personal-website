import { useEffect, useState } from "react";
import { colorSpan, colors } from "../colors";
import { MinHeap } from "../minheap";
import type { AppExit, Command } from "./types";

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
  const cellSize = 24;

  function renderGrid(contentEntries, emptyVal = '.') {
    const initialGrid = Array.from({ length: arraySize }, () => new Array(arraySize).fill(emptyVal));
    contentEntries.forEach(([x, y, content]) => {
      initialGrid[y][x] = content;
    });
    return initialGrid;
  }

  function makeInitialState() {
    return {
      grid: renderGrid([]),
      toVisit: new MinHeap(),
      visited: {},
      path: [],
      start: [0, 0],
      end: [10, 10],
      cursor: [0, 0]
    };
  }

  const [gridState, setGridState] = useState(makeInitialState);
  const [paused, setPaused] = useState(false);

  function pause() {
    setPaused(true);
  }

  function unpause() {
    setPaused(false);
  }

  useEffect(() => {
    if (paused) return;

    const refresh = () => {
      function buildGrid(visited, start, end, path = []) {
        const visitedContent = Object.entries(visited).map(([key, value]) => {
          const [xStr, yStr] = key.split(",");
          const content = !!value ? "o" : "█";
          return [parseInt(xStr), parseInt(yStr), content];
        });
        const pathContent = path.map(([x, y]) =>
          [x, y, colorSpan('x', colors.lightPurple)]
        );
        const startContent = [...start, colorSpan('S', colors.purple)];
        const endContent = [...end, colorSpan('E', colors.purple)];
        return renderGrid([...visitedContent, ...pathContent, startContent, endContent]);
      }

      function runRouting(prev) {
        const {start, end, toVisit, visited} = prev;
        if (Object.keys(visited).length === 0) {
          toVisit.push(0, start);
          for (var i = 3; i < 15; i++) {
            visited[[i, 3]] = null;
            visited[[3, i]] = null;
          }

        }
        const [_, curNode] = toVisit.pop();
        const neighbors = gridNeighbors(curNode[0], curNode[1], 0, 19, 0, 19);
        neighbors.forEach(neighbor => {
          if (neighbor in visited) return;

          const [nX, nY] = neighbor;
          visited[neighbor] = curNode;
          toVisit.push(dist(nX, nY, end[0], end[1]), neighbor)
        });

        return {
          ...prev,
          grid: buildGrid(visited, start, end),
        };
      }

      function runRouteHighlight(prev) {
        const {path, start, end, visited} = prev;
        if (path.at(-1) === start) {
          return prev; // done
        }

        if (path.length === 0) {
          path.push(end);
        } else {
          path.push(visited[path.at(-1)]);
        }

        return {
          ...prev,
          grid: buildGrid(visited, start, end, path),
          path,
        };
      }

      setGridState(prev => {
        if (prev.end in prev.visited) {
          const next = runRouteHighlight(prev);
          if (next === prev) {
            pause();
          }
          return next;
        }

        return runRouting(prev);
      });

    };
    const id = window.setInterval(refresh, 100);
    return () => window.clearInterval(id);
  }, [paused]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "q" || e.key === "Q") {
        e.preventDefault();
        onExit();
      }

      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        setGridState(makeInitialState());
        unpause();
      }

      if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        setPaused(prev => !prev);
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
      
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${arraySize}, ${cellSize}px)`,
          gridAutoRows: `${cellSize}px`,
          lineHeight: `${cellSize}px`,
          textAlign: "center",
        }}
      >
        {gridState.grid.flat().map((cell, idx) => (
          <span key={idx}>{cell}</span>
        ))}
      </div>

      <div>&nbsp;</div>
      <div style={{ color: colors.gray }}>
        {colorSpan("q", colors.lightPurple)} to quit
      </div>
      <div style={{ color: colors.gray }}>
        {colorSpan("r", colors.lightPurple)} to restart
      </div>
      <div style={{ color: colors.gray }}>
        {colorSpan("p", colors.lightPurple)} to toggle pause
      </div>
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
