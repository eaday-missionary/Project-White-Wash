import { useEffect, useState, type JSX } from 'react'

export default function TitleBar(): JSX.Element {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    let active = true

    const stopListening = window.api.windowControls.onMaximizeChange(setIsMaximized)

    window.api.windowControls
      .isMaximized()
      .then((maximized) => {
        if (active) {
          setIsMaximized(maximized)
        }
      })
      .catch((error) => {
        console.error('Unable to read window state:', error)
      })

    return () => {
      active = false
      stopListening()
    }
  }, [])

  return (
    <header className="titlebar">
      <div className="titlebar-brand">
        <span className="titlebar-logo">W</span>
        <span className="titlebar-name">Project White Wash</span>
      </div>

      <div className="titlebar-controls">
        <button
          type="button"
          className="titlebar-button"
          aria-label="Minimize window"
          title="Minimize"
          onClick={() => window.api.windowControls.minimize()}
        >
          <span aria-hidden="true">−</span>
        </button>

        <button
          type="button"
          className="titlebar-button"
          aria-label={isMaximized ? 'Restore window' : 'Maximize window'}
          title={isMaximized ? 'Restore' : 'Maximize'}
          onClick={() => window.api.windowControls.toggleMaximize()}
        >
          <span aria-hidden="true">{isMaximized ? '❐' : '□'}</span>
        </button>

        <button
          type="button"
          className="titlebar-button titlebar-close"
          aria-label="Close window"
          title="Close"
          onClick={() => window.api.windowControls.close()}
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
    </header>
  )
}
