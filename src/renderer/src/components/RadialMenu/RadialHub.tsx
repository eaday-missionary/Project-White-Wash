import type { JSX, ReactNode } from 'react'

export function RadialHub({
  diameter,
  children,
  label,
  onSelect
}: {
  diameter: number
  children: ReactNode
  label?: string
  onSelect?: () => void
}): JSX.Element {
  const style = { width: diameter, height: diameter, fontSize: Math.min(14, diameter / 22) }
  return onSelect ? (
    <button className="radial-hub" style={style} aria-label={label} onClick={onSelect}>
      {children}
    </button>
  ) : (
    <div className="radial-hub" style={style}>
      {children}
    </div>
  )
}
