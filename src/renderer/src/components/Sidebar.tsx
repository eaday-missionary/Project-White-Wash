import { useRef, useState, type JSX } from 'react'
import { additionalPages } from '../data/placeholderPages'

export type PageId =
  'dashboard' | 'planner' | 'tutorials' | 'software' | 'playground' | keyof typeof additionalPages

type SidebarProps = {
  currentPage: PageId
  onNavigate: (page: PageId) => void
}

const menuItems: { id: PageId; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'planner', label: 'Transfer Planner' },
  { id: 'tutorials', label: 'Tutorials' },
  { id: 'software', label: 'Software' },
  { id: 'playground', label: 'UI Playground' },
  ...Object.entries(additionalPages).map(([id, label]) => ({ id: id as PageId, label }))
]

export default function Sidebar({ currentPage, onNavigate }: SidebarProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)

  function closeMenu(): void {
    setOpen(false)
    toggleRef.current?.focus()
  }

  return (
    <div
      className={`sidebar-menu${open ? ' sidebar-menu--open' : ''}`}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.preventDefault()
          closeMenu()
        }
      }}
    >
      <button
        ref={toggleRef}
        type="button"
        className="sidebar-toggle"
        aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={open}
        aria-controls="app-sidebar"
        onClick={() => setOpen((value) => !value)}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 6h18M3 12h18M3 18h18" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </button>
      {currentPage !== 'dashboard' && (
        <button
          type="button"
          className="sidebar-toggle sidebar-home"
          aria-label="Home"
          title="Back to dashboard"
          onClick={() => {
            onNavigate('dashboard')
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="m3 10 9-7 9 7v11h-6v-7H9v7H3Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
      <aside id="app-sidebar" className="sidebar" hidden={!open}>
        <div className="brand">
          <div className="brand-icon">W</div>
          <div>
            <strong>WHITE WASH</strong>
            <span>TECH OFFICE</span>
          </div>
        </div>

        <div className="sidebar-section-label">WORKSPACE</div>

        <nav className="nav-list" aria-label="Main navigation">
          {menuItems.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={currentPage === item.id ? 'nav-button active' : 'nav-button'}
              aria-current={currentPage === item.id ? 'page' : undefined}
              onClick={() => {
                onNavigate(item.id)
              }}
            >
              <span className="nav-number">{String(index + 1).padStart(2, '0')}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          Project White Wash
          <span>Local desktop workspace</span>
        </div>
      </aside>
    </div>
  )
}
