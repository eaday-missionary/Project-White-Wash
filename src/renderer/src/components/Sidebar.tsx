import type { JSX } from 'react'

export type PageId = 'dashboard' | 'planner' | 'tutorials' | 'software' | 'playground' | 'editor'

type SidebarProps = {
  currentPage: PageId
  onNavigate: (page: PageId) => void
}

const menuItems: { id: PageId; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'planner', label: 'Transfer Planner' },
  { id: 'tutorials', label: 'Tutorials' },
  { id: 'software', label: 'Software' },
  { id: 'editor', label: 'Content Editor' },
  { id: 'playground', label: 'UI Playground' }
]

export default function Sidebar({ currentPage, onNavigate }: SidebarProps): JSX.Element {
  return (
    <aside className="sidebar">
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
            onClick={() => onNavigate(item.id)}
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
  )
}
