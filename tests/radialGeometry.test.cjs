/* eslint-disable @typescript-eslint/no-require-imports -- Node/Electron CommonJS test entry point. */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const {
  createSegments,
  segmentLabelBox
} = require('../src/renderer/src/components/RadialMenu/radialGeometry.ts')

test('empty and unmeasured layouts', () => {
  assert.deepEqual(createSegments([], 600, 400), [])
  assert.deepEqual(createSegments(['a'], 0, 400), [])
})

test('all counts and aspect ratios cover rectangle and leave circular hub', () => {
  for (const [width, height] of [
    [950, 756],
    [650, 556],
    [1600, 500],
    [500, 1600],
    [600, 600],
    [240, 180]
  ]) {
    for (let count = 1; count <= 12; count++) {
      const ids = Array.from({ length: count }, (_, i) => `item-${i}`)
      const segments = createSegments(ids, width, height)
      assert.equal(segments.length, count)
      assert.equal(segments[0].midAngle, 0)
      let area = 0
      for (const [index, s] of segments.entries()) {
        assert.equal(s.itemId, ids[index])
        assert.ok(!/NaN|Infinity/.test(s.path))
        const next = segments[(index + 1) % count]
        assert.ok(
          Math.hypot(s.innerEnd.x - next.innerStart.x, s.innerEnd.y - next.innerStart.y) < 1e-7
        )
        for (const p of [s.innerStart, s.innerEnd])
          assert.ok(Math.abs(Math.hypot(p.x - s.center.x, p.y - s.center.y) - s.innerRadius) < 1e-7)
        for (const p of s.boundaryPoints.slice(1, -1)) {
          assert.ok(p.x >= -1e-7 && p.x <= width + 1e-7 && p.y >= -1e-7 && p.y <= height + 1e-7)
          assert.ok(
            Math.min(Math.abs(p.x), Math.abs(p.x - width), Math.abs(p.y), Math.abs(p.y - height)) <
              1e-7
          )
        }
        // Polygon area plus the signed circular-segment correction for the inner arc.
        const points = s.boundaryPoints
        let polygon = 0
        for (let i = 0; i < points.length; i++) {
          const a = points[i],
            b = points[(i + 1) % points.length]
          polygon += a.x * b.y - b.x * a.y
        }
        const angle = s.endAngle - s.startAngle
        area += polygon / 2 - (s.innerRadius ** 2 / 2) * (angle - Math.sin(angle))
        const box = segmentLabelBox(s, count)
        for (const dx of [-box.size / 2, box.size / 2])
          for (const dy of [-box.size / 2, box.size / 2]) {
            const x = box.x + dx,
              y = box.y + dy
            assert.ok(x >= 0 && x <= width && y >= 0 && y <= height)
            assert.ok(Math.hypot(x - s.center.x, y - s.center.y) >= s.innerRadius)
            if (count > 1) {
              const angle =
                (((Math.atan2(x - s.center.x, s.center.y - y) - s.startAngle) % (2 * Math.PI)) +
                  2 * Math.PI) %
                (2 * Math.PI)
              assert.ok(angle <= s.endAngle - s.startAngle + 1e-7)
            }
          }
      }
      assert.ok(Math.abs(area - (width * height - Math.PI * segments[0].innerRadius ** 2)) < 1e-6)
      assert.deepEqual(
        createSegments([...ids].reverse(), width, height).map((s) => s.itemId),
        [...ids].reverse()
      )
    }
  }
})

const {
  outlineMetrics,
  chooseBrushes
} = require('../src/renderer/src/components/RadialMenu/brushGeometry.ts')

test('brush outline follows straight edges without the central arc', () => {
  for (let count = 1; count <= 12; count++) {
    for (const segment of createSegments(
      Array.from({ length: count }, (_, i) => String(i)),
      950,
      756
    )) {
      const outline = outlineMetrics(segment)
      let straight = 0
      for (let i = 1; i < segment.boundaryPoints.length; i++) {
        const a = segment.boundaryPoints[i - 1],
          b = segment.boundaryPoints[i]
        const point = outline.sample(straight)
        assert.ok(Math.hypot(point.x - a.x, point.y - a.y) < 1e-6)
        straight += Math.hypot(b.x - a.x, b.y - a.y)
      }
      assert.ok(Math.abs(outline.length - straight) < 1e-6)
      const first = outline.sample(0),
        last = outline.sample(outline.length)
      assert.ok(Math.hypot(first.x - segment.innerStart.x, first.y - segment.innerStart.y) < 1e-6)
      assert.ok(Math.hypot(last.x - segment.innerEnd.x, last.y - segment.innerEnd.y) < 1e-6)
    }
  }
})

test('each brush selection contains four or five distinct source textures', () => {
  for (let i = 0; i < 100; i++) {
    const selection = chooseBrushes(8)
    assert.ok([4, 5].includes(selection.length))
    assert.equal(new Set(selection).size, selection.length)
    assert.ok(selection.every((index) => index >= 0 && index < 8))
  }
  assert.equal(chooseBrushes(8, () => 0.1).length, 4)
  assert.equal(chooseBrushes(8, () => 0.9).length, 5)
})
