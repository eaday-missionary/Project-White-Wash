import { memo, type JSX } from 'react'
import { segmentLabelBox, type SegmentGeometry } from './radialGeometry'
import type { RadialMenuItem } from './radialMenu.types'

interface Props {
  item: RadialMenuItem
  geometry: SegmentGeometry
  count: number
}

export const RadialSegment = memo(function RadialSegment({
  item,
  geometry,
  count
}: Props): JSX.Element {
  const box = segmentLabelBox(geometry, count)
  return (
    <g className="radial-segment" data-disabled={item.disabled || undefined}>
      <path
        className="radial-segment-path"
        d={geometry.path}
        role="button"
        data-item-id={item.id}
        tabIndex={item.disabled ? -1 : 0}
        aria-label={item.label}
        aria-description={item.description}
        aria-disabled={item.disabled || undefined}
        onClick={() => {
          if (!item.disabled) item.onSelect()
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            if (!item.disabled) item.onSelect()
          }
        }}
      />
      <foreignObject
        x={box.x - box.size / 2}
        y={box.y - box.size / 2}
        width={box.size}
        height={box.size}
        className="radial-label"
        aria-hidden="true"
      >
        <div className="radial-label-content" style={{ fontSize: Math.min(15, box.size / 9) }}>
          <span className="radial-icon">{item.icon}</span>
          <strong>{item.label}</strong>
          {item.description && <span>{item.description}</span>}
          <span>Open section {'\u2192'}</span>
        </div>
      </foreignObject>
    </g>
  )
})
