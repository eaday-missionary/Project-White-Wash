import { useState, type JSX } from 'react'

import Sidebar, { type PageId } from './components/Sidebar'

import DashboardPage from './pages/DashboardPage'
import PlaceholderPage from './pages/PlaceholderPage'
import TitleBar from './components/TitleBar'
import UIPlaygroundPage from './pages/UIPlaygroundPage'
import TutorialsPage from './pages/TutorialsPage'
import SoftwarePage from './pages/SoftwarePage'

const pageDetails: Record<
  Exclude<PageId, 'dashboard' | 'playground' | 'tutorials' | 'software'>,
  { title: string; description: string }
> = {
  planner: {
    title: 'Transfer Planner',
    description: 'Organize and manage transfers.'
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
          ) : currentPage === 'playground' ? (
            <UIPlaygroundPage />
          ) : currentPage === 'tutorials' ? (
            <TutorialsPage />
          ) : currentPage === 'software' ? (
            <SoftwarePage />
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
