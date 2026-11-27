import { memo, useLayoutEffect, useRef, type JSX } from 'react'
import type { SegmentGeometry } from './radialGeometry'
import { loadBrushes } from './brushImages'

export const HubBrushEffects = memo(function HubBrushEffects({
  segment
}: {
  segment?: SegmentGeometry
}): JSX.Element {
  const ref = useRef<HTMLCanvasElement>(null)
  useLayoutEffect(() => {
    const canvas = ref.current
    if (!canvas || !segment) return
    let cancelled = false
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(segment.width * ratio)
    canvas.height = Math.round(segment.height * ratio)
    const context = canvas.getContext('2d')!
    context.scale(ratio, ratio)
    delete canvas.dataset.ready
    void loadBrushes()
      .then((images) => {
        if (cancelled || !images.length) return
        const { center, innerRadius } = segment
        const thickness = innerRadius * 1.5
        const strokeCount = 14
        for (let index = 0; index < strokeCount; index++) {
          const angle = (index * Math.PI * 2) / strokeCount
          const brush = images[index % images.length]
          const length = (thickness * brush.width) / brush.height
          context.save()
          context.translate(
            center.x + Math.cos(angle) * innerRadius,
            center.y + Math.sin(angle) * innerRadius
          )
          context.rotate(angle + Math.PI)
          context.drawImage(brush, -length / 2, -thickness / 2, length, thickness)
          context.restore()
        }
        canvas.dataset.strokeCount = String(strokeCount)
        canvas.dataset.ready = 'true'
      })
      .catch((error: unknown) => {
        if (!cancelled) console.error('Unable to load hub brush textures:', error)
      })
    return () => {
      cancelled = true
    }
  }, [segment])
  return <canvas ref={ref} className="radial-effects radial-hub-effects" aria-hidden="true" />
})
