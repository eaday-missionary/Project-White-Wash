export interface Point {
  x: number
  y: number
}

export interface SegmentGeometry {
  itemId: string
  path: string
  // Clockwise: innerStart, outerStart, intervening corners, outerEnd, innerEnd.
  // Close the outline with the counterclockwise inner arc, not a straight chord.
  boundaryPoints: Point[]
  startAngle: number
  endAngle: number
  midAngle: number
  innerStart: Point
  innerEnd: Point
  innerRadius: number
  center: Point
  width: number
  height: number
}

const TAU = Math.PI * 2
const point = (center: Point, radius: number, angle: number): Point => ({
  x: center.x + radius * Math.sin(angle),
  y: center.y - radius * Math.cos(angle)
})
const xy = (p: Point): string => `${p.x},${p.y}`

// Angles are radians clockwise from twelve o'clock.
export function rectangleIntersection(width: number, height: number, angle: number): Point {
  const dx = Math.sin(angle)
  const dy = -Math.cos(angle)
  const distance = Math.min(width / 2 / Math.abs(dx), height / 2 / Math.abs(dy))
  return { x: width / 2 + dx * distance, y: height / 2 + dy * distance }
}

export function createSegments(
  ids: string[],
  width: number,
  height: number,
  hubScale = 1
): SegmentGeometry[] {
  if (!ids.length || width <= 0 || height <= 0) return []
  const center = { x: width / 2, y: height / 2 }
  const innerRadius = Math.min(160, Math.min(width, height) * 0.22) * hubScale
  const step = TAU / ids.length
  const corners = [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height }
  ]
  return ids.map((itemId, index) => {
    const midAngle = index * step
    const startAngle = midAngle - step / 2
    const endAngle = startAngle + step
    const innerStart = point(center, innerRadius, startAngle)
    const innerEnd = point(center, innerRadius, endAngle)
    const outerStart = rectangleIntersection(width, height, startAngle)
    const outerEnd = rectangleIntersection(width, height, endAngle)
    const between = corners
      .map((corner) => ({
        corner,
        offset:
          (((Math.atan2(corner.x - center.x, center.y - corner.y) - startAngle) % TAU) + TAU) % TAU
      }))
      .filter(({ offset }) => offset > 1e-9 && offset < step - 1e-9)
      .sort((a, b) => a.offset - b.offset)
      .map(({ corner }) => corner)
    const boundaryPoints = [innerStart, outerStart, ...between, outerEnd, innerEnd]
    const lines = boundaryPoints.map((p, i) => `${i ? 'L' : 'M'} ${xy(p)}`).join(' ')
    // A full circle requires two arcs; a single SVG arc with identical ends is empty.
    const arc =
      ids.length === 1
        ? `A ${innerRadius},${innerRadius} 0 0 0 ${xy(point(center, innerRadius, startAngle + Math.PI))} A ${innerRadius},${innerRadius} 0 0 0 ${xy(innerStart)}`
        : `A ${innerRadius},${innerRadius} 0 ${step > Math.PI ? 1 : 0} 0 ${xy(innerStart)}`
    return {
      itemId,
      path: `${lines} ${arc} Z`,
      boundaryPoints,
      startAngle,
      endAngle,
      midAngle,
      innerStart,
      innerEnd,
      innerRadius,
      center,
      width,
      height
    }
  })
}

// An axis-aligned square contained within the wedge, rectangle and outside the hub.
export function segmentLabelBox(segment: SegmentGeometry, count: number): Point & { size: number } {
  const { center, width, height, midAngle, innerRadius } = segment
  const outer = rectangleIntersection(width, height, midAngle)
  const outerDistance = Math.hypot(outer.x - center.x, outer.y - center.y)
  const distance = (innerRadius + outerDistance) / 2
  const position = point(center, distance, midAngle)
  const clearance = Math.min(
    position.x,
    width - position.x,
    position.y,
    height - position.y,
    distance - innerRadius,
    count === 1 ? Infinity : distance * Math.sin(Math.PI / count)
  )
  return { ...position, size: Math.max(0, clearance * Math.SQRT2 * 0.9) }
}
