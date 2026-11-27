import type { Point, SegmentGeometry } from './radialGeometry'

export interface OutlineSample extends Point {
  angle: number
}

// Follow only the straight edges and rectangular corners; leave the hub arc untouched.
export function outlineMetrics(segment: SegmentGeometry): {
  length: number
  sample: (distance: number) => OutlineSample
} {
  const points = segment.boundaryPoints
  const lengths = points.slice(1).map((p, i) => Math.hypot(p.x - points[i].x, p.y - points[i].y))
  const length = lengths.reduce((sum, edgeLength) => sum + edgeLength, 0)
  return {
    length,
    sample(distance) {
      let remaining = Math.max(0, Math.min(distance, length))
      for (let i = 0; i < lengths.length; i++) {
        if (lengths[i] > 0 && remaining < lengths[i]) {
          const a = points[i],
            b = points[i + 1],
            fraction = remaining / lengths[i]
          return {
            x: a.x + (b.x - a.x) * fraction,
            y: a.y + (b.y - a.y) * fraction,
            angle: Math.atan2(b.y - a.y, b.x - a.x)
          }
        }
        remaining -= lengths[i]
      }
      const end = points[points.length - 1]
      const previous = points[points.length - 2]
      return { ...end, angle: Math.atan2(end.y - previous.y, end.x - previous.x) }
    }
  }
}

export function chooseBrushes(count: number, random: () => number = Math.random): number[] {
  const indices = Array.from({ length: count }, (_, i) => i)
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }
  return indices.slice(0, Math.min(count, random() < 0.5 ? 4 : 5))
}
