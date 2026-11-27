import { useEffect, useLayoutEffect, useRef, type JSX } from 'react'
import type { SegmentGeometry } from './radialGeometry'
import { chooseBrushes, outlineMetrics } from './brushGeometry'
import { loadBrushes } from './brushImages'

const BRUSH_THICKNESS = 275

interface CachedStroke {
  canvas: HTMLCanvasElement
  count: number
}

export function BrushEffects({
  geometry,
  activeId
}: {
  geometry: SegmentGeometry[]
  activeId: string | null
}): JSX.Element {
  const ref = useRef<HTMLCanvasElement>(null)
  const selections = useRef(new Map<string, number[]>())
  const cache = useRef(new Map<string, CachedStroke>())
  useEffect(() => {
    // Warm the texture cache before the first hover. Render reports any loading errors.
    void loadBrushes().catch(() => {})
  }, [])
  useLayoutEffect(() => {
    cache.current.clear()
    const ids = new Set(geometry.map((segment) => segment.itemId))
    for (const id of selections.current.keys()) if (!ids.has(id)) selections.current.delete(id)
  }, [geometry])

  // Clear the previous item's pixels before the browser paints its uncovered segment.
  useLayoutEffect(() => {
    const canvas = ref.current
    const segment = geometry.find((item) => item.itemId === activeId)
    if (!canvas) return
    let cancelled = false
    let frame = 0
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    const width = geometry[0]?.width ?? 0,
      height = geometry[0]?.height ?? 0
    canvas.width = Math.round(width * ratio)
    canvas.height = Math.round(height * ratio)
    const context = canvas.getContext('2d')!
    context.scale(ratio, ratio)
    delete canvas.dataset.activeItemId
    delete canvas.dataset.strokeCount
    delete canvas.dataset.brushCount
    delete canvas.dataset.ready
    if (!segment) return

    const render = async (): Promise<void> => {
      const images = await loadBrushes()
      if (cancelled || !images.length) return
      const outline = outlineMetrics(segment)
      const strokeCount = Math.max(25, Math.ceil(outline.length / (BRUSH_THICKNESS / 3)))
      let cached = cache.current.get(segment.itemId)
      if (!cached) {
        const indices = selections.current.get(segment.itemId) ?? chooseBrushes(images.length)
        selections.current.set(segment.itemId, indices)
        const texture = document.createElement('canvas')
        texture.width = canvas.width
        texture.height = canvas.height
        const paint = texture.getContext('2d')!
        paint.scale(ratio, ratio)
        const thickness = BRUSH_THICKNESS
        // Keep stamps outside the hub without leaving a gap around it.
        const outsideHub = new Path2D()
        outsideHub.rect(0, 0, width, height)
        outsideHub.moveTo(segment.center.x + segment.innerRadius, segment.center.y)
        outsideHub.arc(segment.center.x, segment.center.y, segment.innerRadius, 0, Math.PI * 2)
        paint.clip(outsideHub, 'evenodd')
        // Never cache hidden interior pixels that could flash as the segment shrinks away.
        const outsideSegment = new Path2D()
        outsideSegment.rect(0, 0, width, height)
        outsideSegment.addPath(new Path2D(segment.path))
        paint.clip(outsideSegment, 'evenodd')
        // Scale coverage with the straight-edge length, sharing four or five source images.
        for (let index = 0; index < strokeCount; index++) {
          const distance = (outline.length * (index + 0.5)) / strokeCount
          const brush = images[indices[index % indices.length]]
          const position = outline.sample(distance)
          const length = (thickness * brush.width) / brush.height
          paint.save()
          paint.translate(position.x, position.y)
          paint.rotate(position.angle + Math.PI / 2)
          paint.drawImage(brush, -length / 2, -thickness / 2, length, thickness)
          paint.restore()
        }
        cached = { canvas: texture, count: indices.length }
        // Only retain a few full-size textures, even in menus with many items.
        if (cache.current.size >= 3) cache.current.delete(cache.current.keys().next().value!)
        cache.current.set(segment.itemId, cached)
      }
      canvas.dataset.activeItemId = segment.itemId
      canvas.dataset.brushCount = String(cached.count)
      canvas.dataset.strokeCount = String(strokeCount)
      const texture = cached.canvas
      const start = performance.now()
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const draw = (now: number): void => {
        if (cancelled) return
        const progress = reducedMotion ? 1 : Math.min(1, (now - start) / 300)
        context.clearRect(0, 0, width, height)
        context.save()
        // Reveal from both hub endpoints, meeting halfway along the straight outline.
        const distance = (outline.length * progress) / 2
        if (progress === 1) {
          context.drawImage(texture, 0, 0, width, height)
          canvas.dataset.ready = 'true'
        } else {
          // Clip to two growing outline ends without regenerating the cached texture.
          const mask = new Path2D()
          for (let d = 0; progress > 0 && d <= distance; d += 6) {
            for (const offset of [d, outline.length - d]) {
              const point = outline.sample(offset)
              const padding = BRUSH_THICKNESS / 2 + 10
              mask.rect(point.x - padding, point.y - padding, padding * 2, padding * 2)
            }
          }
          context.clip(mask)
          context.drawImage(texture, 0, 0, width, height)
        }
        context.restore()
        if (progress < 1) frame = requestAnimationFrame(draw)
      }
      draw(start)
    }
    void render().catch((error: unknown) => {
      if (!cancelled) console.error('Unable to load brush textures:', error)
    })
    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
    }
  }, [activeId, geometry])
  return <canvas ref={ref} className="radial-effects" aria-hidden="true" />
}
