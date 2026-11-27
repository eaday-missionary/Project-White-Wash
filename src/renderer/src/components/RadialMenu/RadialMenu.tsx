import { useCallback, useEffect, useMemo, useState, type JSX } from 'react'
import { createSegments } from './radialGeometry'
import { RadialSegment } from './RadialSegment'
import { RadialHub } from './RadialHub'
import { BrushEffects } from './BrushEffects'
import { HubBrushEffects } from './HubBrushEffects'
import { useElementSize } from './useElementSize'
import type { RadialMenuProps } from './radialMenu.types'
import './RadialMenu.css'

export function RadialMenu({
  items,
  label = 'Quick Access',
  hub,
  hubLabel,
  hubScale = 1,
  hubBrushes = false,
  onHubSelect,
  onGeometryChange,
  onHoverChange
}: RadialMenuProps): JSX.Element {
  const { ref, width, height } = useElementSize()
  const visible = useMemo(
    () => items.filter((item) => !item.hidden).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [items]
  )
  // Geometry depends only on ordered IDs and size, never on hover or callbacks.
  const ids = JSON.stringify(visible.map((item) => item.id))
  const geometry = useMemo(
    () => createSegments(JSON.parse(ids), width, height, hubScale),
    [ids, width, height, hubScale]
  )
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const activeHover = visible.some((item) => item.id === hoveredId && !item.disabled)
    ? hoveredId
    : null
  const activeId =
    activeHover ??
    (visible.some((item) => item.id === focusedId && !item.disabled) ? focusedId : null)
  const updateHover = useCallback((id: string | null) => setHoveredId(id), [])
  useEffect(() => {
    onGeometryChange?.(geometry)
  }, [geometry, onGeometryChange])
  useEffect(() => {
    onHoverChange?.(activeHover)
  }, [activeHover, onHoverChange])
  return (
    <div ref={ref} className="radial-menu" data-hovered-item-id={activeHover ?? undefined}>
      <svg
        className="radial-background"
        width={width}
        height={height}
        role="group"
        aria-label={label}
        onFocus={(event) => setFocusedId((event.target as SVGElement).dataset.itemId ?? null)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocusedId(null)
        }}
        onPointerOver={(event) => {
          const target = event.target as SVGElement
          const id = target.dataset.itemId
          updateHover(visible.some((item) => item.id === id && !item.disabled) ? id! : null)
        }}
        onPointerLeave={() => updateHover(null)}
        onKeyDown={(event) => {
          if (
            !['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(event.key)
          )
            return
          const paths = Array.from(
            event.currentTarget.querySelectorAll<SVGPathElement>(
              '[role="button"]:not([aria-disabled="true"])'
            )
          )
          if (!paths.length) return
          event.preventDefault()
          const index = paths.indexOf(document.activeElement as SVGPathElement)
          const next =
            event.key === 'Home'
              ? 0
              : event.key === 'End'
                ? paths.length - 1
                : (index + (['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 1) + paths.length) %
                  paths.length
          paths[next].focus()
        }}
      >
        {geometry.map((segment, index) => (
          <RadialSegment
            key={segment.itemId}
            item={visible[index]}
            geometry={segment}
            count={visible.length}
            active={segment.itemId === activeId}
          />
        ))}
      </svg>
      <BrushEffects geometry={geometry} activeId={activeId} />
      {hubBrushes && <HubBrushEffects segment={geometry[0]} />}
      <RadialHub
        diameter={(geometry[0]?.innerRadius ?? Math.min(width, height) * 0.22 * hubScale) * 2}
        label={hubLabel}
        onSelect={onHubSelect}
      >
        {hub ?? label}
        {!visible.length && <p>No items available.</p>}
      </RadialHub>
    </div>
  )
}
