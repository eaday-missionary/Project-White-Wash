import type { JSX, ReactNode } from 'react'

type CardProps = {
  title?: string
  description?: string
  children: ReactNode
}

export default function Card({ title, description, children }: CardProps): JSX.Element {
  return (
    <section className="ui-card">
      {(title || description) && (
        <header className="ui-card-header">
          {title && <h2>{title}</h2>}
          {description && <p>{description}</p>}
        </header>
      )}

      <div className="ui-card-content">{children}</div>
    </section>
  )
}
