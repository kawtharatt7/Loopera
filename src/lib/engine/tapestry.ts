// Tapestry crochet chart to written rows. Pure TypeScript, unit tested.
// The piece is worked flat from the bottom of the picture up, in single crochet, carrying the
// unused colors inside the stitches. Right-side rows read the chart from right to left,
// wrong-side rows from left to right, which is how a crocheter follows a graph.

export interface ColorRun {
  color: number; // palette index
  count: number;
}

export interface TapestryRow {
  number: number; // 1-based, row 1 is the bottom row of the picture
  side: "RS" | "WS";
  /** Runs in the order they are worked. */
  runs: ColorRun[];
  stitches: number;
}

export interface TapestryPattern {
  width: number;
  height: number;
  foundation: number; // chains to start
  rows: TapestryRow[];
  /** Stitches of each color across the whole piece, for yarn estimates. */
  stitchesByColor: number[];
}

export class TapestryValidationError extends Error {}

/** Collapses a row of colors into runs, in working order. */
export function runsOf(cells: number[]): ColorRun[] {
  const runs: ColorRun[] = [];
  for (const c of cells) {
    const last = runs[runs.length - 1];
    if (last && last.color === c) last.count++;
    else runs.push({ color: c, count: 1 });
  }
  return runs;
}

export function tapestryPattern(grid: number[][], paletteSize: number): TapestryPattern {
  const height = grid.length;
  if (height === 0) throw new TapestryValidationError("The chart is empty");
  const width = grid[0].length;
  if (width < 2) throw new TapestryValidationError("The chart needs at least 2 stitches per row");
  const rows: TapestryRow[] = [];
  const stitchesByColor = new Array<number>(paletteSize).fill(0);
  for (let i = 0; i < height; i++) {
    const cells = grid[height - 1 - i];
    if (cells.length !== width) throw new TapestryValidationError(`Row ${i + 1} has ${cells.length} cells, expected ${width}`);
    for (const c of cells) {
      if (!Number.isInteger(c) || c < 0 || c >= paletteSize) throw new TapestryValidationError(`Row ${i + 1} uses an unknown color ${c}`);
      stitchesByColor[c]++;
    }
    const side = i % 2 === 0 ? "RS" : "WS";
    const ordered = side === "RS" ? [...cells].reverse() : cells;
    rows.push({ number: i + 1, side, runs: runsOf(ordered), stitches: width });
  }
  const pattern = { width, height, foundation: width + 1, rows, stitchesByColor };
  validateTapestry(pattern);
  return pattern;
}

/** Every row must consume and produce exactly `width` stitches, with no empty or repeated runs. */
export function validateTapestry(p: TapestryPattern): void {
  for (const r of p.rows) {
    const total = r.runs.reduce((a, run) => a + run.count, 0);
    if (total !== p.width) throw new TapestryValidationError(`Row ${r.number} works ${total} stitches, expected ${p.width}`);
    r.runs.forEach((run, i) => {
      if (run.count <= 0) throw new TapestryValidationError(`Row ${r.number} has an empty color change`);
      if (i > 0 && r.runs[i - 1].color === run.color) throw new TapestryValidationError(`Row ${r.number} changes to the same color`);
    });
  }
}

/** Written instruction for one row, e.g. "4 sc Cream, 6 sc Wine (30)". */
export function rowText(row: TapestryRow, colorName: (i: number) => string, sc = "sc"): string {
  return row.runs.map((r) => `${r.count} ${sc} ${colorName(r.color)}`).join(", ");
}
