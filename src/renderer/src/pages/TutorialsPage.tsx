import { useState, type JSX } from 'react'

import Card from '../components/ui/Card'
import TextField from '../components/ui/TextField'
import SelectField from '../components/ui/SelectField'

import tutorialData from '../data/tutorials.json'
import type { Tutorial } from '../types/resources'

const tutorials: Tutorial[] = tutorialData

const categoryOptions = [
  { value: 'all', label: 'All categories' },
  ...Array.from(new Set(tutorials.map((t) => t.category))).map((category) => ({
    value: category,
    label: category
  }))
]

export default function TutorialsPage(): JSX.Element {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(tutorials[0]?.id ?? null)

  const filteredTutorials = tutorials.filter((tutorial) => {
    const matchesCategory = category === 'all' || tutorial.category === category

    const query = search.trim().toLowerCase()

    const matchesSearch =
      tutorial.title.toLowerCase().includes(query) ||
      tutorial.summary.toLowerCase().includes(query) ||
      tutorial.category.toLowerCase().includes(query)

    return matchesCategory && matchesSearch
  })

  const selectedTutorial =
    filteredTutorials.find((tutorial) => tutorial.id === selectedId) ?? filteredTutorials[0]

  const videoFile = selectedTutorial?.videoFile

  const videoSrc =
    videoFile && /^[a-z0-9 _-]+\.mp4$/i.test(videoFile)
      ? `${import.meta.env.BASE_URL}videos/${encodeURIComponent(videoFile)}`
      : null

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

      <div className="tutorial-layout">
        <Card
          title="Available Tutorials"
          description={`${filteredTutorials.length} tutorials found`}
        >
          <div className="tutorial-list">
            {filteredTutorials.map((tutorial) => (
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

            {filteredTutorials.length === 0 && (
              <p className="resource-muted">No tutorials match your search.</p>
            )}
          </div>
        </Card>

        <Card
          title={selectedTutorial?.title ?? 'No tutorial selected'}
          description={selectedTutorial?.summary}
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
                </details>
              ))}

              {videoSrc && (
                <section className="tutorial-video-section">
                  <h3>Training Video</h3>

                  <video
                    key={videoSrc}
                    className="tutorial-video"
                    controls
                    preload="metadata"
                    src={videoSrc}
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
