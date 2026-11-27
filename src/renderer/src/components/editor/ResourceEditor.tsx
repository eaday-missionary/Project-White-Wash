import { useEffect, useRef, useState, type JSX } from 'react'
import type { AppContent, Tutorial, SoftwareResource } from '../../types/resources'
import { isWebsite } from '../../utils/resources'
import Button from '../ui/Button'
import Card from '../ui/Card'
import TutorialForm from './TutorialForm'
import SoftwareForm from './SoftwareForm'

type Props = {
  kind: 'tutorials' | 'software'
  item: Tutorial | SoftwareResource | null
  content: AppContent
  onSave: (content: AppContent) => Promise<void>
  onClose: () => void
}

export default function ResourceEditor({
  kind,
  item,
  content,
  onSave,
  onClose
}: Props): JSX.Element {
  const editorRef = useRef<HTMLFieldSetElement>(null)
  useEffect(() => {
    editorRef.current?.scrollIntoView({ block: 'start' })
    editorRef.current?.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true })
  }, [])
  const [tutorial, setTutorial] = useState<Tutorial | null>(() =>
    kind === 'tutorials'
      ? (structuredClone(item as Tutorial | null) ?? {
          id: crypto.randomUUID(),
          title: '',
          category: 'Getting Started',
          summary: '',
          estimatedMinutes: 5,
          steps: [{ title: '', body: '' }]
        })
      : null
  )
  const [software, setSoftware] = useState<SoftwareResource | null>(() =>
    kind === 'software'
      ? (structuredClone(item as SoftwareResource | null) ?? {
          id: crypto.randomUUID(),
          name: '',
          category: '',
          description: '',
          url: 'https://'
        })
      : null
  )
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function persist(remove = false): Promise<void> {
    if (saving) return
    const draft = kind === 'tutorials' ? tutorial : software
    if (!draft) return
    setNotice('')
    if (!remove) {
      if (
        !draft.category.trim() ||
        (tutorial &&
          (!tutorial.title.trim() ||
            !Number.isFinite(tutorial.estimatedMinutes) ||
            tutorial.estimatedMinutes < 1 ||
            !tutorial.steps.length ||
            tutorial.steps.some((step) => !step.title.trim() || !step.body.trim()))) ||
        (software && !software.name.trim())
      ) {
        setNotice('Fill in the name or title, category, duration, and every step.')
        return
      }
      const linkLists = tutorial
        ? tutorial.steps.map((step) => step.links ?? [])
        : [software!.links ?? [software!.url]]
      if (
        linkLists.some((links) => links.length > 10 || links.some((link) => !isWebsite(link))) ||
        (software && !linkLists[0].length)
      ) {
        setNotice(
          'Use valid http:// or https:// links (up to 10). Software needs at least one link.'
        )
        return
      }
    }
    setSaving(true)
    try {
      if (tutorial) {
        const updated = {
          ...tutorial,
          title: tutorial.title.trim(),
          category: tutorial.category.trim()
        }
        await onSave({
          ...content,
          tutorials: remove
            ? content.tutorials.filter((entry) => entry.id !== draft.id)
            : item
              ? content.tutorials.map((entry) => (entry.id === draft.id ? updated : entry))
              : [...content.tutorials, updated]
        })
      } else if (software) {
        const updated = {
          ...software,
          name: software.name.trim(),
          category: software.category.trim(),
          url: (software.links ?? [software.url])[0]
        }
        await onSave({
          ...content,
          software: remove
            ? content.software.filter((entry) => entry.id !== draft.id)
            : item
              ? content.software.map((entry) => (entry.id === draft.id ? updated : entry))
              : [...content.software, updated]
        })
      }
      onClose()
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card title={`${item ? 'Edit' : 'Add'} ${kind === 'tutorials' ? 'tutorial' : 'software'}`}>
      {notice && <p role="alert">{notice}</p>}
      <fieldset ref={editorRef} className="resource-editor" disabled={saving}>
        {tutorial && (
          <TutorialForm
            tutorialDraft={tutorial}
            setTutorialDraft={(draft) => (draft ? setTutorial(draft) : onClose())}
            saveTutorial={() => persist()}
            saving={saving}
          />
        )}
        {software && (
          <SoftwareForm
            softwareDraft={software}
            setSoftwareDraft={(draft) => (draft ? setSoftware(draft) : onClose())}
            saveSoftware={() => persist()}
            saving={saving}
          />
        )}
        {item && (
          <div className="ui-inline-actions editor-delete-actions">
            <Button
              variant="danger"
              onClick={() => (confirmDelete ? void persist(true) : setConfirmDelete(true))}
            >
              {confirmDelete ? 'Confirm delete' : 'Delete item'}
            </Button>
            {confirmDelete && (
              <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
                Keep item
              </Button>
            )}
          </div>
        )}
      </fieldset>
    </Card>
  )
}
