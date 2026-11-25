import type { ReactNode } from 'react'
import type { SegmentGeometry } from './radialGeometry'

export interface RadialMenuItem {
  id: string
  label: string
  icon: ReactNode
  description?: string
  order?: number
  disabled?: boolean
  hidden?: boolean
  onSelect: () => void
}

export interface RadialMenuProps {
  items: RadialMenuItem[]
  label?: string
  hub?: ReactNode
  hubLabel?: string
  onHubSelect?: () => void
  onGeometryChange?: (geometry: SegmentGeometry[]) => void
  onHoverChange?: (itemId: string | null) => void
}
