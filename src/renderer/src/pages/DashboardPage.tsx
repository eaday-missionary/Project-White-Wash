import { lazy, Suspense, useMemo, useState, type ReactNode, type JSX } from 'react'
import { RadialMenu } from '../components/RadialMenu'
import type { RadialMenuItem } from '../components/RadialMenu'
import type { PageId } from '../components/Sidebar'
import './DashboardPage.css'

const DevelopmentPlayground = import.meta.env.DEV
  ? lazy(() => import('../components/RadialMenu/RadialMenuPlayground'))
  : null

type DashboardProps = {
  onNavigate: (page: PageId) => void
}

const features: {
  id: PageId
  title: string
  description: string
  icon: ReactNode
}[] = [
  {
    id: 'planner',
    title: 'Transfer Planner',
    description: 'Plan and organize transfers.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <>
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M8 3v4m8-4v4M4 10h16m-12 4h3m2 3h3" />
        </>
      </svg>
    )
  },
  {
    id: 'tutorials',
    title: 'Tutorials & Training',
    description: 'Learn Tech Office procedures.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path d="M12 5v15M3 4c4-1 6 0 9 2 3-2 5-3 9-2v14c-4-1-6 0-9 2-3-2-5-3-9-2Z" />
      </svg>
    )
  },
  {
    id: 'software',
    title: 'Essential Software',
    description: 'Find applications and resources.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <>
          <rect x="3" y="4" width="18" height="13" rx="2" />
          <path d="M8 21h8m-4-4v4" />
        </>
      </svg>
    )
  }
]

export default function DashboardPage({ onNavigate }: DashboardProps): JSX.Element {
  const [hubBrushesEnabled, setHubBrushesEnabled] = useState(true)
  const items = useMemo<RadialMenuItem[]>(
    () =>
      features.map((feature, index) => ({
        id: feature.id,
        label: feature.title,
        description: feature.description,
        icon: (
          <>
            <span>{String(index + 1).padStart(2, '0')}</span>
            {feature.icon}
          </>
        ),
        onSelect: () => onNavigate(feature.id)
      })),
    [onNavigate]
  )

  if (
    DevelopmentPlayground &&
    new URLSearchParams(window.location.search).has('radial-playground')
  ) {
    return (
      <Suspense fallback={null}>
        <DevelopmentPlayground />
      </Suspense>
    )
  }

  return (
    <RadialMenu
      items={items}
      label="Quick Access"
      hubScale={0.7}
      hubBrushes={hubBrushesEnabled}
      hub={
        <header className="dashboard-hub-copy">
          <p>YOUR WORKSPACE</p>
          <h1>Dashboard</h1>
          <p>Welcome to Project White Wash. Your Tech Office tools in one place.</p>
          <h2>Quick Access</h2>
          <button
            type="button"
            className="dashboard-brush-toggle"
            aria-label="Center brushes"
            aria-pressed={hubBrushesEnabled}
            onClick={() => setHubBrushesEnabled((enabled) => !enabled)}
          >
            Center brushes: {hubBrushesEnabled ? 'On' : 'Off'}
          </button>
        </header>
      }
    />
  )
}
