import type { RoadmapLayout, RoadmapTreeNode, PlacedLine, PlacedNode, SpineArrow } from './roadmap.types';

const SPINE_W = 268;
const SPINE_H = 56;
const SPINE_RX = 14;
const BRANCH_W = 216;
const BRANCH_H = 46;
const BRANCH_RX = 10;

const DROP = 20;
const CHILD_H_GAP = 28;
const ARROW_H = 22;
const ARROW_SIZE = 9;
const TOP_MARGIN = 48;
const SPINE_BELOW_GAP = 28;
const BETWEEN_SPINE_GAP = 20;

interface Subtree {
  width: number;
  height: number;
  nodes: PlacedNode[];
  lines: PlacedLine[];
}

function layoutBranchSubtree(node: RoadmapTreeNode): Subtree {
  const children = node.children ?? [];
  if (children.length === 0) {
    return {
      width: BRANCH_W,
      height: BRANCH_H,
      nodes: [
        {
          id: node.id,
          kind: 'branch',
          x: 0,
          y: 0,
          width: BRANCH_W,
          height: BRANCH_H,
          rx: BRANCH_RX,
        },
      ],
      lines: [],
    };
  }

  const childSubs = children.map(layoutBranchSubtree);
  const sumChildW =
    childSubs.reduce((s, c) => s + c.width, 0) + CHILD_H_GAP * Math.max(0, childSubs.length - 1);
  const totalW = Math.max(BRANCH_W, sumChildW);
  const maxChildH = Math.max(...childSubs.map(c => c.height));

  const parentX = (totalW - BRANCH_W) / 2;
  const yBus = BRANCH_H + DROP;
  const childY = yBus + DROP;

  const nodes: PlacedNode[] = [
    {
      id: node.id,
      kind: 'branch',
      x: parentX,
      y: 0,
      width: BRANCH_W,
      height: BRANCH_H,
      rx: BRANCH_RX,
    },
  ];
  const lines: PlacedLine[] = [];

  const parentCx = parentX + BRANCH_W / 2;
  lines.push({ x1: parentCx, y1: BRANCH_H, x2: parentCx, y2: yBus });

  let offsetX = (totalW - sumChildW) / 2;
  const childCenters: number[] = [];
  for (let i = 0; i < childSubs.length; i++) {
    const sub = childSubs[i]!;
    const cx = offsetX + sub.width / 2;
    childCenters.push(cx);

    for (const n of sub.nodes) {
      nodes.push({
        ...n,
        x: n.x + offsetX,
        y: n.y + childY,
      });
    }
    for (const ln of sub.lines) {
      lines.push({
        x1: ln.x1 + offsetX,
        y1: ln.y1 + childY,
        x2: ln.x2 + offsetX,
        y2: ln.y2 + childY,
      });
    }
    lines.push({ x1: cx, y1: yBus, x2: cx, y2: childY });
    offsetX += sub.width + CHILD_H_GAP;
  }

  if (childCenters.length > 0) {
    lines.push({
      x1: childCenters[0]!,
      y1: yBus,
      x2: childCenters[childCenters.length - 1]!,
      y2: yBus,
    });
  }

  const height = childY + maxChildH;
  return { width: totalW, height, nodes, lines };
}

function layoutBranchForest(children: RoadmapTreeNode[]): Subtree {
  if (children.length === 0) {
    return { width: 0, height: 0, nodes: [], lines: [] };
  }

  const subs = children.map(layoutBranchSubtree);
  const sumW = subs.reduce((s, c) => s + c.width, 0) + CHILD_H_GAP * Math.max(0, subs.length - 1);
  const maxH = Math.max(...subs.map(s => s.height));

  const nodes: PlacedNode[] = [];
  const lines: PlacedLine[] = [];
  const yBus = DROP;
  const childY = yBus + DROP;

  let ox = 0;
  const centers: number[] = [];
  for (let i = 0; i < subs.length; i++) {
    const sub = subs[i]!;
    const cx = ox + sub.width / 2;
    centers.push(cx);

    for (const n of sub.nodes) {
      nodes.push({ ...n, x: n.x + ox, y: n.y + childY });
    }
    for (const ln of sub.lines) {
      lines.push({
        x1: ln.x1 + ox,
        y1: ln.y1 + childY,
        x2: ln.x2 + ox,
        y2: ln.y2 + childY,
      });
    }
    lines.push({ x1: cx, y1: yBus, x2: cx, y2: childY });
    ox += sub.width + CHILD_H_GAP;
  }

  if (centers.length > 0) {
    lines.push({
      x1: centers[0]!,
      y1: yBus,
      x2: centers[centers.length - 1]!,
      y2: yBus,
    });
  }

  return { width: sumW, height: childY + maxH, nodes, lines };
}

function translateSubtree(s: Subtree, dx: number, dy: number): Subtree {
  return {
    width: s.width,
    height: s.height,
    nodes: s.nodes.map(n => ({ ...n, x: n.x + dx, y: n.y + dy })),
    lines: s.lines.map(l => ({
      x1: l.x1 + dx,
      y1: l.y1 + dy,
      x2: l.x2 + dx,
      y2: l.y2 + dy,
    })),
  };
}

function extendHorizontalAtY(lines: PlacedLine[], y: number, cx: number) {
  for (const l of lines) {
    if (Math.abs(l.y1 - l.y2) < 1e-6 && Math.abs(l.y1 - y) < 1e-6) {
      const left = Math.min(l.x1, l.x2);
      const right = Math.max(l.x1, l.x2);
      l.x1 = Math.min(left, cx);
      l.x2 = Math.max(right, cx);
    }
  }
}

export function computeRoadmapLayout(spine: RoadmapTreeNode[]): RoadmapLayout {
  const nodes: PlacedNode[] = [];
  const lines: PlacedLine[] = [];
  const spineArrows: SpineArrow[] = [];

  let y = TOP_MARGIN;

  for (let si = 0; si < spine.length; si++) {
    const s = spine[si]!;
    const ch = s.children ?? [];
    const rawForest = ch.length > 0 ? layoutBranchForest(ch) : null;
    const forest = rawForest ? translateSubtree(rawForest, 0, 0) : null;

    const blockW = Math.max(SPINE_W, forest?.width ?? 0);
    const spineLeft = -blockW / 2 + (blockW - SPINE_W) / 2;
    const spineCx = spineLeft + SPINE_W / 2;

    nodes.push({
      id: s.id,
      kind: 'spine',
      x: spineLeft,
      y,
      width: SPINE_W,
      height: SPINE_H,
      rx: SPINE_RX,
    });

    let blockBottom = y + SPINE_H;

    if (forest && forest.height > 0) {
      const forestLeft = -forest.width / 2;
      const forestTop = y + SPINE_H;
      const moved = translateSubtree(forest, forestLeft, forestTop);
      nodes.push(...moved.nodes);
      lines.push(...moved.lines);

      const busWorldY = y + SPINE_H + DROP;
      lines.push({ x1: spineCx, y1: y + SPINE_H, x2: spineCx, y2: busWorldY });
      extendHorizontalAtY(lines, busWorldY, spineCx);

      blockBottom = forestTop + forest.height;
    }

    if (si < spine.length - 1) {
      const arrowYTop = blockBottom + BETWEEN_SPINE_GAP;
      spineArrows.push({
        x: spineCx,
        yTop: arrowYTop,
        yTip: arrowYTop + ARROW_H,
        size: ARROW_SIZE,
      });
      y = arrowYTop + ARROW_H + SPINE_BELOW_GAP;
    } else {
      y = blockBottom + SPINE_BELOW_GAP;
    }
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const n of nodes) {
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + n.width);
    maxY = Math.max(maxY, n.y + n.height);
  }
  for (const l of lines) {
    minX = Math.min(minX, l.x1, l.x2);
    minY = Math.min(minY, l.y1, l.y2);
    maxX = Math.max(maxX, l.x1, l.x2);
    maxY = Math.max(maxY, l.y1, l.y2);
  }
  for (const a of spineArrows) {
    minX = Math.min(minX, a.x - a.size);
    maxX = Math.max(maxX, a.x + a.size);
    minY = Math.min(minY, a.yTop);
    maxY = Math.max(maxY, a.yTip);
  }
  if (!Number.isFinite(minX)) {
    minX = minY = maxX = maxY = 0;
  }

  const pad = 80;
  return {
    nodes,
    lines,
    spineArrows,
    bounds: {
      minX: minX - pad,
      minY: minY - pad,
      maxX: maxX + pad,
      maxY: maxY + pad,
    },
  };
}
