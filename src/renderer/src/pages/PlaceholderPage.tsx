import type { JSX } from 'react'

type PlaceholderProps = {
  title: string
  description: string
  onReturn: () => void
}

export default function PlaceholderPage({
  title,
  description,
  onReturn
}: PlaceholderProps): JSX.Element {
  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">PROJECT WHITE WASH</p>
        <h1>{title}</h1>
        <p className="page-description">{description}</p>
      </header>

      <div className="placeholder-card">
        <span className="placeholder-label">IN DEVELOPMENT</span>

        <h2>Coming Soon</h2>
        <p>This section will be built in a future development milestone.</p>

        <button type="button" className="primary-button" onClick={onReturn}>
          Return to Dashboard
        </button>
      </div>
    </div>
  )
}
