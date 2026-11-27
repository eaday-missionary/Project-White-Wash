import { useEffect, useState, type JSX } from 'react'

import Sidebar, { type PageId } from './components/Sidebar'

import TitleBar from './components/TitleBar'

import DashboardPage from './pages/DashboardPage'
import PlaceholderPage from './pages/PlaceholderPage'
import UIPlaygroundPage from './pages/UIPlaygroundPage'
import TutorialsPage from './pages/TutorialsPage'
import SoftwarePage from './pages/SoftwarePage'
import ContentEditorPage from './pages/ContentEditorPage'

import defaultTutorials from './data/tutorials.json'
import defaultSoftware from './data/software.json'

import type { AppContent } from './types/resources'

const initialContent: AppContent = {
  tutorials: defaultTutorials,
  software: defaultSoftware
}

const pageDetails = {
  planner: {
    title: 'Transfer Planner',
    description: 'Organize and manage transfers.'
  }
}

function App(): JSX.Element {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard')

  const [content, setContent] = useState<AppContent>(initialContent)

  const [contentReady, setContentReady] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    window.api.content
      .load()
      .then((savedContent) => {
        if (active && savedContent !== null) {
          setContent(savedContent)
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(error instanceof Error ? error.message : 'Unable to load saved content.')
        }
      })
      .finally(() => {
        if (active) setContentReady(true)
      })

    return () => {
      active = false
    }
  }, [])

  async function saveContent(next: AppContent): Promise<void> {
    await window.api.content.save(next)
    setContent(next)
  }

  function renderPage(): JSX.Element {
    if (!contentReady) {
      return <p>Loading content...</p>
    }

    if (loadError) {
      return (
        <div className="page">
          <h1>Unable to load content</h1>
          <p className="page-description">{loadError}</p>
          <p className="page-description">
            The saved file has not been overwritten. Check the local content file before continuing.
          </p>
        </div>
      )
    }

    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage onNavigate={setCurrentPage} />

      case 'tutorials':
        return <TutorialsPage tutorials={content.tutorials} />

      case 'software':
        return <SoftwarePage software={content.software} />

      case 'editor':
        return <ContentEditorPage content={content} onSave={saveContent} />

      case 'playground':
        return <UIPlaygroundPage />

      case 'planner':
        return (
          <PlaceholderPage
            title={pageDetails.planner.title}
            description={pageDetails.planner.description}
            onReturn={() => setCurrentPage('dashboard')}
          />
        )
    }
  }

  return (
    <div className="desktop-app">
      <TitleBar />

      <div className="app-shell">
        <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />

        <main
          className={`main-content${currentPage === 'dashboard' ? ' main-content--dashboard' : ''}`}
        >
          {renderPage()}
        </main>
      </div>
    </div>
  )
}

export default App
