import { memo, useId, useState, type JSX } from 'react'
import { brushUrls } from './brushImages'
import { segmentLabelBox, type SegmentGeometry } from './radialGeometry'
import type { RadialMenuItem } from './radialMenu.types'

interface Props {
  item: RadialMenuItem
  geometry: SegmentGeometry
  count: number
  active: boolean
}

function LabelBrush({ size }: { size: number }): JSX.Element {
  const [source] = useState(() => brushUrls[Math.floor(Math.random() * brushUrls.length)])
  return (
    <image
      className="radial-label-brush"
      href={source}
      x={-size / 2}
      y={-size / 4}
      width={size}
      height={size / 2}
      aria-hidden="true"
    />
  )
}

export const RadialSegment = memo(function RadialSegment({
  item,
  geometry,
  count,
  active
}: Props): JSX.Element {
  const box = segmentLabelBox(geometry, count)
  const clipId = useId()
  return (
    <g
      className="radial-segment"
      data-disabled={item.disabled || undefined}
      data-active={active || undefined}
    >
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
      {active && (
        <g clipPath={`url(#${clipId})`} className="radial-label-brush-layer" aria-hidden="true">
          <defs>
            <clipPath id={clipId}>
              <path d={geometry.path} />
            </clipPath>
          </defs>
          <g
            transform={`translate(${box.x} ${box.y}) rotate(${(geometry.midAngle * 180) / Math.PI - 90})`}
          >
            <LabelBrush size={box.size * 3.6} />
          </g>
        </g>
      )}
      <foreignObject
        x={box.x - box.size / 2}
        y={box.y - box.size / 2}
        width={box.size}
        height={box.size}
        className="radial-label"
        aria-hidden="true"
      >
        <div className="radial-label-content" style={{ fontSize: Math.min(15, box.size / 11) }}>
          <span className="radial-icon">{item.icon}</span>
          <strong>{item.label}</strong>
          {item.description && <span>{item.description}</span>}
          <span>Open section {'\u2192'}</span>
        </div>
      </foreignObject>
    </g>
  )
})
