import type { JSX } from 'react'
import Button from '../components/ui/Button'

type PlaceholderProps = {
  title: string
  description?: string
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
        {description && <p className="page-description">{description}</p>}
      </header>

      <div className="placeholder-card">
        <span className="placeholder-label">IN DEVELOPMENT</span>

        <h2>Coming Soon</h2>
        <p>This section will be built in a future development milestone.</p>

        <Button onClick={onReturn}>Return to Dashboard</Button>
      </div>
    </div>
  )
}
