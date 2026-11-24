import { useState, type JSX } from 'react'

import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import TextField from '../components/ui/TextField'
import Modal from '../components/ui/Modal'

import type { AppContent, Tutorial, SoftwareResource } from '../types/resources'

type EditorProps = {
  content: AppContent
  onSave: (content: AppContent) => Promise<void>
}

type DeleteTarget = {
  kind: 'tutorial' | 'software'
  id: string
  name: string
}

function newTutorial(): Tutorial {
  return {
    id: crypto.randomUUID(),
    title: '',
    category: 'Getting Started',
    summary: '',
    estimatedMinutes: 5,
    steps: [{ title: '', body: '' }]
  }
}

function newSoftware(): SoftwareResource {
  return {
    id: crypto.randomUUID(),
    name: '',
    category: '',
    description: '',
    url: 'https://'
  }
}

export default function ContentEditorPage({ content, onSave }: EditorProps): JSX.Element {
  const [mode, setMode] = useState<'tutorials' | 'software'>('tutorials')

  const [tutorialDraft, setTutorialDraft] = useState<Tutorial | null>(null)

  const [softwareDraft, setSoftwareDraft] = useState<SoftwareResource | null>(null)

  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)

  function editTutorial(tutorial: Tutorial): void {
    setTutorialDraft({
      ...tutorial,
      steps: tutorial.steps.map((step) => ({ ...step }))
    })
    setNotice('')
  }

  function editSoftware(software: SoftwareResource): void {
    setSoftwareDraft({ ...software })
    setNotice('')
  }

  function updateStep(index: number, field: 'title' | 'body', value: string): void {
    setTutorialDraft((draft) => {
      if (!draft) return null

      return {
        ...draft,
        steps: draft.steps.map((step, stepIndex) =>
          stepIndex === index ? { ...step, [field]: value } : step
        )
      }
    })
  }

  async function persist(next: AppContent): Promise<boolean> {
    if (saving) return false

    setSaving(true)
    setNotice('')

    try {
      await onSave(next)
      setNotice('Changes saved to this computer.')
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'

      setNotice(`Save failed: ${message}`)
      return false
    } finally {
      setSaving(false)
    }
  }

  async function saveTutorial(): Promise<void> {
    if (!tutorialDraft) return

    const tutorial: Tutorial = {
      ...tutorialDraft,
      title: tutorialDraft.title.trim(),
      category: tutorialDraft.category.trim(),
      summary: tutorialDraft.summary.trim(),
      videoFile: tutorialDraft.videoFile?.trim() || undefined,
      steps: tutorialDraft.steps.map((step) => ({
        title: step.title.trim(),
        body: step.body.trim()
      }))
    }

    if (
      !tutorial.title ||
      !tutorial.category ||
      !Number.isFinite(tutorial.estimatedMinutes) ||
      tutorial.estimatedMinutes < 1 ||
      tutorial.steps.length === 0 ||
      tutorial.steps.some((step) => !step.title || !step.body)
    ) {
      setNotice('Fill in the title, category, duration, and every step.')
      return
    }

    if (tutorial.videoFile && !/^[a-z0-9_-]+\.mp4$/i.test(tutorial.videoFile)) {
      setNotice('Use a simple MP4 filename, such as welcome.mp4.')
      return
    }

    const exists = content.tutorials.some((item) => item.id === tutorial.id)

    const next: AppContent = {
      ...content,
      tutorials: exists
        ? content.tutorials.map((item) => (item.id === tutorial.id ? tutorial : item))
        : [...content.tutorials, tutorial]
    }

    if (await persist(next)) {
      setTutorialDraft(null)
    }
  }

  async function saveSoftware(): Promise<void> {
    if (!softwareDraft) return

    const software: SoftwareResource = {
      ...softwareDraft,
      name: softwareDraft.name.trim(),
      category: softwareDraft.category.trim(),
      description: softwareDraft.description.trim(),
      url: softwareDraft.url.trim()
    }

    if (!software.name || !software.category) {
      setNotice('Enter a software name and category.')
      return
    }

    let validUrl = false

    try {
      const parsed = new URL(software.url)
      validUrl = parsed.protocol === 'https:' || parsed.protocol === 'http:'
    } catch {
      validUrl = false
    }

    if (!validUrl) {
      setNotice('Enter a valid http:// or https:// website.')
      return
    }

    const exists = content.software.some((item) => item.id === software.id)

    const next: AppContent = {
      ...content,
      software: exists
        ? content.software.map((item) => (item.id === software.id ? software : item))
        : [...content.software, software]
    }

    if (await persist(next)) {
      setSoftwareDraft(null)
    }
  }

  async function confirmDelete(): Promise<void> {
    if (!deleteTarget) return

    const next: AppContent =
      deleteTarget.kind === 'tutorial'
        ? {
            ...content,
            tutorials: content.tutorials.filter((item) => item.id !== deleteTarget.id)
          }
        : {
            ...content,
            software: content.software.filter((item) => item.id !== deleteTarget.id)
          }

    if (await persist(next)) {
      setTutorialDraft(null)
      setSoftwareDraft(null)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">CONTENT MANAGEMENT</p>
        <h1>Content Editor</h1>
        <p className="page-description">
          Add and update tutorials or software resources. Changes are saved locally.
        </p>
      </header>

      <div className="ui-inline-actions editor-mode">
        <Button
          variant={mode === 'tutorials' ? 'primary' : 'secondary'}
          onClick={() => {
            setMode('tutorials')
            setNotice('')
          }}
        >
          Tutorials
        </Button>

        <Button
          variant={mode === 'software' ? 'primary' : 'secondary'}
          onClick={() => {
            setMode('software')
            setNotice('')
          }}
        >
          Software
        </Button>
      </div>

      {notice && (
        <p className="editor-notice" role="status">
          {notice}
        </p>
      )}

      {mode === 'tutorials' ? (
        <div className="editor-layout">
          <Card title="Tutorials">
            <Button onClick={() => editTutorial(newTutorial())}>+ New Tutorial</Button>

            {content.tutorials.map((tutorial) => (
              <div className="editor-row" key={tutorial.id}>
                <div>
                  <strong>{tutorial.title}</strong>
                  <small>{tutorial.category}</small>
                </div>

                <div className="ui-inline-actions">
                  <Button variant="secondary" onClick={() => editTutorial(tutorial)}>
                    Edit
                  </Button>

                  <Button
                    variant="danger"
                    onClick={() =>
                      setDeleteTarget({
                        kind: 'tutorial',
                        id: tutorial.id,
                        name: tutorial.title
                      })
                    }
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </Card>

          <Card title="Tutorial Details">
            {tutorialDraft ? (
              <form
                className="editor-form"
                onSubmit={(event) => {
                  event.preventDefault()
                  void saveTutorial()
                }}
              >
                <TextField
                  label="Title"
                  value={tutorialDraft.title}
                  onChange={(event) =>
                    setTutorialDraft({
                      ...tutorialDraft,
                      title: event.target.value
                    })
                  }
                />

                <TextField
                  label="Category"
                  value={tutorialDraft.category}
                  onChange={(event) =>
                    setTutorialDraft({
                      ...tutorialDraft,
                      category: event.target.value
                    })
                  }
                />

                <label className="editor-field">
                  Summary
                  <textarea
                    value={tutorialDraft.summary}
                    onChange={(event) =>
                      setTutorialDraft({
                        ...tutorialDraft,
                        summary: event.target.value
                      })
                    }
                  />
                </label>

                <TextField
                  label="Estimated minutes"
                  type="number"
                  min={1}
                  value={tutorialDraft.estimatedMinutes}
                  onChange={(event) =>
                    setTutorialDraft({
                      ...tutorialDraft,
                      estimatedMinutes: Number(event.target.value)
                    })
                  }
                />

                <TextField
                  label="Video filename (optional)"
                  placeholder="welcome.mp4"
                  value={tutorialDraft.videoFile ?? ''}
                  onChange={(event) =>
                    setTutorialDraft({
                      ...tutorialDraft,
                      videoFile: event.target.value
                    })
                  }
                />

                <h3>Instruction Steps</h3>

                {tutorialDraft.steps.map((step, index) => (
                  <div className="editor-step" key={index}>
                    <strong>Step {index + 1}</strong>

                    <TextField
                      label="Step title"
                      value={step.title}
                      onChange={(event) => updateStep(index, 'title', event.target.value)}
                    />

                    <label className="editor-field">
                      Instructions
                      <textarea
                        rows={5}
                        value={step.body}
                        onChange={(event) => updateStep(index, 'body', event.target.value)}
                      />
                    </label>

                    <Button
                      variant="danger"
                      disabled={saving || tutorialDraft.steps.length <= 1}
                      onClick={() =>
                        setTutorialDraft({
                          ...tutorialDraft,
                          steps: tutorialDraft.steps.filter((_, stepIndex) => stepIndex !== index)
                        })
                      }
                    >
                      Remove Step
                    </Button>
                  </div>
                ))}

                <Button
                  variant="secondary"
                  onClick={() =>
                    setTutorialDraft({
                      ...tutorialDraft,
                      steps: [...tutorialDraft.steps, { title: '', body: '' }]
                    })
                  }
                >
                  + Add Step
                </Button>

                <div className="ui-inline-actions">
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Tutorial'}
                  </Button>

                  <Button variant="secondary" onClick={() => setTutorialDraft(null)}>
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <p className="resource-muted">Select a tutorial to edit, or create a new one.</p>
            )}
          </Card>
        </div>
      ) : (
        <div className="editor-layout">
          <Card title="Software Resources">
            <Button onClick={() => editSoftware(newSoftware())}>+ New Software</Button>

            {content.software.map((software) => (
              <div className="editor-row" key={software.id}>
                <div>
                  <strong>{software.name}</strong>
                  <small>{software.category}</small>
                </div>

                <div className="ui-inline-actions">
                  <Button variant="secondary" onClick={() => editSoftware(software)}>
                    Edit
                  </Button>

                  <Button
                    variant="danger"
                    onClick={() =>
                      setDeleteTarget({
                        kind: 'software',
                        id: software.id,
                        name: software.name
                      })
                    }
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </Card>

          <Card title="Software Details">
            {softwareDraft ? (
              <form
                className="editor-form"
                onSubmit={(event) => {
                  event.preventDefault()
                  void saveSoftware()
                }}
              >
                <TextField
                  label="Name"
                  value={softwareDraft.name}
                  onChange={(event) =>
                    setSoftwareDraft({
                      ...softwareDraft,
                      name: event.target.value
                    })
                  }
                />

                <TextField
                  label="Category"
                  value={softwareDraft.category}
                  onChange={(event) =>
                    setSoftwareDraft({
                      ...softwareDraft,
                      category: event.target.value
                    })
                  }
                />

                <label className="editor-field">
                  Description
                  <textarea
                    rows={4}
                    value={softwareDraft.description}
                    onChange={(event) =>
                      setSoftwareDraft({
                        ...softwareDraft,
                        description: event.target.value
                      })
                    }
                  />
                </label>

                <TextField
                  label="Website URL"
                  type="url"
                  value={softwareDraft.url}
                  onChange={(event) =>
                    setSoftwareDraft({
                      ...softwareDraft,
                      url: event.target.value
                    })
                  }
                />

                <div className="ui-inline-actions">
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Software'}
                  </Button>

                  <Button variant="secondary" onClick={() => setSoftwareDraft(null)}>
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <p className="resource-muted">Select a software entry or create a new one.</p>
            )}
          </Card>
        </div>
      )}

      <Modal
        open={deleteTarget !== null}
        title="Delete Content?"
        onClose={() => {
          if (!saving) setDeleteTarget(null)
        }}
      >
        <p>Delete "{deleteTarget?.name}"? This will remove the entry when you save the change.</p>

        <div className="ui-inline-actions">
          <Button variant="danger" disabled={saving} onClick={() => void confirmDelete()}>
            {saving ? 'Deleting...' : 'Delete'}
          </Button>

          <Button variant="secondary" disabled={saving} onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  )
}
