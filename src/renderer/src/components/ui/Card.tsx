import type { JSX, ReactNode } from 'react'

type CardProps = {
  title?: string
  description?: string
  children: ReactNode
  action?: ReactNode
}

export default function Card({ title, description, children, action }: CardProps): JSX.Element {
  return (
    <section className="ui-card">
      {(title || description || action) && (
        <header className="ui-card-header">
          {action && <div className="resource-card-action">{action}</div>}
          {title && <h2>{title}</h2>}
          {description && <p>{description}</p>}
        </header>
      )}

      <div className="ui-card-content">{children}</div>
    </section>
  )
}
