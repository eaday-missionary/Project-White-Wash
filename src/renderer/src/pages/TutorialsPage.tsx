import { useState, type JSX } from 'react'

import { getCategoryOptions, videoSource } from '../utils/resources'

import Card from '../components/ui/Card'
import TextField from '../components/ui/TextField'
import SelectField from '../components/ui/SelectField'

import Button from '../components/ui/Button'
import Tabs from '../components/ui/Tabs'
import ResourceEditor from '../components/editor/ResourceEditor'
import type { AppContent, Tutorial } from '../types/resources'

// Define the information this component receives
type TutorialsPageProps = {
  content: AppContent
  onSave: (content: AppContent) => Promise<void>
}

export default function TutorialsPage({ content, onSave }: TutorialsPageProps): JSX.Element {
  const { tutorials } = content
  const [draft, setDraft] = useState<Tutorial | null | undefined>(undefined)
  const [tab, setTab] = useState('')
  // Generate category options from the current tutorials
  const categoryOptions = getCategoryOptions(tutorials)

  // Remember user selections
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(tutorials[0]?.id ?? null)

  // Filter the current tutorials
  const query = search.trim().toLowerCase()

  const filteredTutorials = tutorials.filter((tutorial) => {
    const matchesCategory = category === 'all' || tutorial.category === category

    const matchesSearch =
      tutorial.title.toLowerCase().includes(query) ||
      tutorial.summary.toLowerCase().includes(query) ||
      tutorial.category.toLowerCase().includes(query)

    return matchesCategory && matchesSearch
  })

  const categories = [...new Set(filteredTutorials.map((item) => item.category))]
  const activeCategory = categories.includes(tab) ? tab : categories[0]
  const visibleTutorials = filteredTutorials.filter((item) => item.category === activeCategory)

  const selectedTutorial =
    visibleTutorials.find((tutorial) => tutorial.id === selectedId) ?? visibleTutorials[0]

  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">KNOWLEDGE CENTER</p>
        <h1>Tutorial Library</h1>
        <p className="page-description">
          Browse training materials and step-by-step instructions for Tech Office tasks.
        </p>
      </header>

      <div className="resource-filters">
        <TextField
          label="Search tutorials"
          type="search"
          placeholder="Search by title or category..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <SelectField
          label="Category"
          options={categoryOptions}
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        />
      </div>

      <div className="resource-add">
        <Button onClick={() => setDraft(null)}>Add tutorial</Button>
      </div>
      {draft !== undefined && (
        <ResourceEditor
          key={draft?.id ?? 'new'}
          kind="tutorials"
          item={draft}
          content={content}
          onSave={onSave}
          onClose={() => setDraft(undefined)}
        />
      )}

      <div className="tutorial-layout">
        <Card
          title="Available Tutorials"
          description={`${filteredTutorials.length} tutorials found`}
        >
          <Tabs
            label="Tutorial categories"
            value={activeCategory ?? ''}
            onChange={setTab}
            items={categories.map((categoryName) => ({
              id: categoryName,
              label: categoryName,
              content: (
                <div className="tutorial-list">
                  {filteredTutorials
                    .filter((tutorial) => tutorial.category === categoryName)
                    .map((tutorial) => (
                      <button
                        key={tutorial.id}
                        type="button"
                        className={
                          selectedTutorial?.id === tutorial.id
                            ? 'tutorial-option selected'
                            : 'tutorial-option'
                        }
                        aria-pressed={selectedTutorial?.id === tutorial.id}
                        onClick={() => setSelectedId(tutorial.id)}
                      >
                        <span className="resource-category">{tutorial.category}</span>
                        <strong>{tutorial.title}</strong>
                        <span className="resource-muted">
                          {tutorial.estimatedMinutes} min · {tutorial.steps.length} steps
                        </span>
                      </button>
                    ))}
                </div>
              )
            }))}
          />
          {!filteredTutorials.length && (
            <p className="resource-muted">No tutorials match your search.</p>
          )}
        </Card>

        <Card
          title={selectedTutorial?.title ?? 'No tutorial selected'}
          description={selectedTutorial?.summary}
          action={
            selectedTutorial && (
              <Button variant="secondary" onClick={() => setDraft(selectedTutorial)}>
                Edit
              </Button>
            )
          }
        >
          {selectedTutorial && (
            <div className="tutorial-content">
              <p className="resource-muted">
                {selectedTutorial.category} · Estimated time: {selectedTutorial.estimatedMinutes}{' '}
                minutes
              </p>

              <h3>Step-by-step instructions</h3>

              {selectedTutorial.steps.map((step, index) => (
                <details
                  key={`${selectedTutorial.id}-${index}`}
                  className="tutorial-step"
                  open={index === 0}
                >
                  <summary>
                    <span className="step-number">{String(index + 1).padStart(2, '0')}</span>
                    {step.title}
                  </summary>

                  <div className="step-body">{step.body}</div>
                  <div className="step-attachments">
                    {(step.links ?? []).map((link, i) => (
                      <a
                        key={i}
                        className="resource-action"
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {link}
                      </a>
                    ))}
                    {(step.videoFiles ?? []).map((file, i) => (
                      <video
                        key={`${file}-${i}`}
                        className="tutorial-video"
                        controls
                        preload="metadata"
                        src={videoSource(file)}
                      />
                    ))}
                  </div>
                </details>
              ))}

              {selectedTutorial.videoFile && (
                <section className="tutorial-video-section">
                  <h3>Training Video</h3>

                  <video
                    key={selectedTutorial.videoFile}
                    className="tutorial-video"
                    controls
                    preload="metadata"
                    src={videoSource(selectedTutorial.videoFile)}
                  >
                    Your system cannot play this video.
                  </video>
                </section>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
