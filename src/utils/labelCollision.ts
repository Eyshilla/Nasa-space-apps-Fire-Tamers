export interface LabelRect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  priority: number; // higher priority stays when collision cannot be resolved
  anchorX?: number;
  anchorY?: number;
}

export interface PositionedLabel extends LabelRect {
  visible: boolean;
}

function overlaps(a: LabelRect, b: LabelRect, pad = 4): boolean {
  return !(
    a.x + a.width + pad <= b.x ||
    b.x + b.width + pad <= a.x ||
    a.y + a.height + pad <= b.y ||
    b.y + b.height + pad <= a.y
  );
}

/**
 * Simple deterministic collision solver for SVG annotations and axis labels.
 * Tries candidate vertical/horizontal shifts inside plot bounds before hiding lower-priority labels.
 */
export function resolveLabelCollisions(
  items: LabelRect[],
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
): PositionedLabel[] {
  const sorted = [...items].sort((a, b) => b.priority - a.priority);
  const placed: PositionedLabel[] = [];

  for (const item of sorted) {
    const candidates: Array<{ dx: number; dy: number }> = [
      { dx: 0, dy: 0 },
      { dx: 0, dy: -(item.height + 6) },
      { dx: 0, dy: item.height + 6 },
      { dx: -(item.width + 8), dy: 0 },
      { dx: 12, dy: -(item.height + 10) },
      { dx: -12, dy: item.height + 10 },
    ];

    let chosen: PositionedLabel | null = null;
    for (const shift of candidates) {
      const clampedX = Math.max(
        bounds.minX,
        Math.min(bounds.maxX - item.width, item.x + shift.dx)
      );
      const clampedY = Math.max(
        bounds.minY,
        Math.min(bounds.maxY - item.height, item.y + shift.dy)
      );
      const testBox: LabelRect = {
        ...item,
        x: clampedX,
        y: clampedY,
      };
      const collides = placed.some((p) => p.visible && overlaps(testBox, p));
      if (!collides) {
        chosen = { ...testBox, visible: true };
        break;
      }
    }

    if (chosen) {
      placed.push(chosen);
    } else {
      placed.push({ ...item, visible: false });
    }
  }

  return placed;
}
