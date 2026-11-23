import type { EnginePart, Gauge, PartPattern, Round, RunGroup } from "./types";

/** Rectangle worked in rows of single crochet. */
export function buildRectangle(part: EnginePart, gauge: Gauge): PartPattern {
  const width = Math.max(2, Math.round(part.widthCm / gauge.stitchWidthCm));
  const rows = Math.max(1, Math.round(part.heightCm / gauge.rowHeightCm));
  const rounds: Round[] = [];
  for (let r = 1; r <= rows; r++) {
    const runs: RunGroup[] =
      r === 1
        ? [
            { repeat: 1, seq: [{ op: "ch", count: width + 1 }] },
            { repeat: 1, seq: [{ op: "sc", count: width }] },
          ]
        : [
            { repeat: 1, seq: [{ op: "ch", count: 1 }, { op: "turn", count: 1 }] },
            { repeat: 1, seq: [{ op: "sc", count: width }] },
          ];
    rounds.push({
      number: r,
      stitches: width,
      instruction:
        r === 1
          ? `ch ${width + 1}, sc in 2nd ch from hook and in each ch across`
          : "ch 1, turn, sc in each st across",
      runs,
      radiusCm: 0,
      yCm: (r - 1) * gauge.rowHeightCm,
    });
  }
  return {
    partId: part.id,
    name: part.name,
    shape: part.shape,
    kind: "rectangle",
    colorHex: part.colorHex,
    quantity: part.quantity,
    closed: false,
    rounds,
    finish: "Fasten off and weave in the ends.",
    totalStitches: width * rows,
  };
}

/** Approximate width of one granny-square round band, in stitch widths (one 3-dc cluster). */
const GRANNY_CLUSTER_WIDTHS = 3;

/** Granny square: round r has 12r dc, in 4r clusters of 3 dc; corners are two clusters with ch 2 between. */
export function buildGrannySquare(part: EnginePart, gauge: Gauge): PartPattern {
  const side = Math.max(part.widthCm, part.heightCm);
  const total = Math.max(1, Math.round(side / (GRANNY_CLUSTER_WIDTHS * gauge.stitchWidthCm)));
  const rounds: Round[] = [];
  for (let r = 1; r <= total; r++) {
    const sideSpaces = Math.max(0, r - 2);
    let instruction: string;
    let runs: RunGroup[];
    if (r === 1) {
      instruction =
        "Magic ring, ch 3 (counts as dc), 2 dc in ring, ch 2, (3 dc in ring, ch 2) x3, join to top of ch 3";
      runs = [
        { repeat: 1, seq: [{ op: "mr", count: 0 }, { op: "ch", count: 3 }, { op: "dc", count: 2 }, { op: "ch", count: 2 }] },
        { repeat: 3, seq: [{ op: "dc", count: 3 }, { op: "ch", count: 2 }] },
        { repeat: 1, seq: [{ op: "join", count: 1 }] },
      ];
    } else {
      const sidePart = sideSpaces > 0 ? `, (3 dc, ch 1) in each of the next ${sideSpaces} ch-1 sp` : "";
      instruction = `Sl st into corner sp; in each corner sp work (3 dc, ch 2, 3 dc), ch 1${sidePart}; repeat around x4, join`;
      runs = [
        {
          repeat: 4,
          seq: [
            { op: "dc", count: 3 },
            { op: "ch", count: 2 },
            { op: "dc", count: 3 },
            { op: "ch", count: 1 },
            ...(sideSpaces > 0 ? [{ op: "dc" as const, count: 3 * sideSpaces }, { op: "ch" as const, count: sideSpaces }] : []),
          ],
        },
        { repeat: 1, seq: [{ op: "join", count: 1 }] },
      ];
    }
    rounds.push({
      number: r,
      stitches: 12 * r,
      instruction,
      runs,
      radiusCm: (r * GRANNY_CLUSTER_WIDTHS * gauge.stitchWidthCm) / 2,
      yCm: 0,
    });
  }
  return {
    partId: part.id,
    name: part.name,
    shape: part.shape,
    kind: "granny_square",
    colorHex: part.colorHex,
    quantity: part.quantity,
    closed: false,
    rounds,
    finish: "Fasten off and weave in the ends.",
    totalStitches: rounds.reduce((a, r) => a + r.stitches, 0),
  };
}
