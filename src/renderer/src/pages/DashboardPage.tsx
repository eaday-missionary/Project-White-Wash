import type { JSX } from 'react'
import type { PageId } from '../components/Sidebar'

type DashboardProps = {
  onNavigate: (page: PageId) => void
}

const features: {
  id: PageId
  title: string
  description: string
}[] = [
  {
    id: 'planner',
    title: 'Transfer Planner',
    description: 'Plan and organize transfers.'
  },
  {
    id: 'tutorials',
    title: 'Tutorials & Training',
    description: 'Learn Tech Office procedures.'
  },
  {
    id: 'software',
    title: 'Essential Software',
    description: 'Find applications and resources.'
  }
]

export default function DashboardPage({ onNavigate }: DashboardProps): JSX.Element {
  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">YOUR WORKSPACE</p>
        <h1>Dashboard</h1>
        <p className="page-description">
          Welcome to Project White Wash. Your Tech Office tools in one place.
        </p>
      </header>

      <section className="feature-section">
        <h2>Quick Access</h2>

        <div className="feature-grid">
          {features.map((feature, index) => (
            <button
              key={feature.id}
              type="button"
              className="feature-card"
              onClick={() => onNavigate(feature.id)}
            >
              <span className="feature-number">{String(index + 1).padStart(2, '0')}</span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <span className="feature-link">Open section →</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
