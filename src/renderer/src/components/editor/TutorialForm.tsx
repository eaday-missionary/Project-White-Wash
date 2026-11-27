import { useState, type JSX } from 'react'
import Button from '../ui/Button'
import TextField from '../ui/TextField'
import VideoFields from './VideoFields'
import LinkFields from './LinkFields'
import type { Tutorial, TutorialStep } from '../../types/resources'

type TutorialFormProps = {
  tutorialDraft: Tutorial
  setTutorialDraft: (draft: Tutorial | null) => void
  saveTutorial: () => Promise<void>
  saving: boolean
}

export default function TutorialForm({
  tutorialDraft,
  setTutorialDraft,
  saveTutorial,
  saving
}: TutorialFormProps): JSX.Element {
  const [importing, setImporting] = useState(false)
  function updateStep(index: number, patch: Partial<TutorialStep>): void {
    setTutorialDraft({
      ...tutorialDraft,
      steps: tutorialDraft.steps.map((step, stepIndex) =>
        stepIndex === index ? { ...step, ...patch } : step
      )
    })
  }

  return (
    <form
      className="editor-form"
      onSubmit={(event) => {
        event.preventDefault()
        if (!importing) void saveTutorial()
      }}
    >
      <fieldset className="resource-editor editor-form" disabled={saving || importing}>
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

        <VideoFields
          onBusyChange={setImporting}
          max={1}
          files={tutorialDraft.videoFile ? [tutorialDraft.videoFile] : []}
          onChange={(files) => setTutorialDraft({ ...tutorialDraft, videoFile: files[0] })}
        />

        <h3>Instruction Steps</h3>

        {tutorialDraft.steps.map((step, index) => (
          <div className="editor-step" key={index}>
            <strong>Step {index + 1}</strong>

            <TextField
              label="Step title"
              value={step.title}
              onChange={(event) => updateStep(index, { title: event.target.value })}
            />

            <label className="editor-field">
              Instructions
              <textarea
                rows={5}
                value={step.body}
                onChange={(event) => updateStep(index, { body: event.target.value })}
              />
            </label>

            <LinkFields
              links={step.links ?? []}
              onChange={(links) => updateStep(index, { links })}
            />
            <VideoFields
              onBusyChange={setImporting}
              max={10}
              files={step.videoFiles ?? []}
              onChange={(videoFiles) => updateStep(index, { videoFiles })}
            />

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
      </fieldset>
    </form>
  )
}
