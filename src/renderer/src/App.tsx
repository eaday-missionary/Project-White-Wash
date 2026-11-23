import { useState, type JSX } from 'react'

import Sidebar, { type PageId } from './components/Sidebar'

import DashboardPage from './pages/DashboardPage'
import PlaceholderPage from './pages/PlaceholderPage'
import TitleBar from './components/TitleBar'

const pageDetails: Record<Exclude<PageId, 'dashboard'>, { title: string; description: string }> = {
  planner: {
    title: 'Transfer Planner',
    description: 'Organize and manage transfers.'
  },
  tutorials: {
    title: 'Tutorials',
    description: 'Training videos and office procedures.'
  },
  software: {
    title: 'Software',
    description: 'Essential tools and application resources.'
  }
}

function App(): JSX.Element {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard')

  return (
    <div className="desktop-app">
      <TitleBar />

      <div className="app-shell">
        <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />

        <main className="main-content">
          {currentPage === 'dashboard' ? (
            <DashboardPage onNavigate={setCurrentPage} />
          ) : (
            <PlaceholderPage
              title={pageDetails[currentPage].title}
              description={pageDetails[currentPage].description}
              onReturn={() => setCurrentPage('dashboard')}
            />
          )}
        </main>
      </div>
    </div>
  )
}

export default App
