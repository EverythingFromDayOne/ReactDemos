export type NodeStatus = 'done' | 'in-progress' | 'planned' | 'skipped';

export type RoadmapBadge = 'NEW' | 'optional' | 'recommended';

export interface RoadmapTreeNode {
  id: string;
  title: string;
  status: NodeStatus;
  description: string;
  badge?: RoadmapBadge;
  route?: string;
  children?: RoadmapTreeNode[];
}

export interface RoadmapData {
  spine: RoadmapTreeNode[];
}

export type LayoutNodeKind = 'spine' | 'branch';

/** Absolute world coordinates after full layout pass */
export interface PlacedNode {
  id: string;
  kind: LayoutNodeKind;
  x: number;
  y: number;
  width: number;
  height: number;
  rx: number;
}

export interface PlacedLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface SpineArrow {
  /** Chevron tip pointing down between two spine nodes */
  x: number;
  yTop: number;
  yTip: number;
  size: number;
}

export interface RoadmapLayout {
  nodes: PlacedNode[];
  lines: PlacedLine[];
  spineArrows: SpineArrow[];
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
}
