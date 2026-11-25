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
