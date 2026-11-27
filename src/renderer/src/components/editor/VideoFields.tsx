import { useState, type JSX } from 'react'
import Button from '../ui/Button'
import { videoSource } from '../../utils/resources'

type Props = {
  files: string[]
  onChange: (files: string[]) => void
  max: number
  onBusyChange: (busy: boolean) => void
}

export default function VideoFields({ files, onChange, max, onBusyChange }: Props): JSX.Element {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  async function importVideo(index?: number): Promise<void> {
    setBusy(true)
    onBusyChange(true)
    setError('')
    try {
      const filename = await window.api.content.importVideo()
      if (filename) {
        setRevision((value) => value + 1)
        onChange(
          index === undefined
            ? [...files, filename]
            : files.map((file, i) => (i === index ? filename : file))
        )
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Video import failed.')
    } finally {
      setBusy(false)
      onBusyChange(false)
    }
  }
  return (
    <fieldset className="editor-form video-fields" disabled={busy}>
      <legend>Videos</legend>
      {files.map((file, index) => (
        <div className="editor-form" key={`${file}-${index}`}>
          <video
            key={revision}
            className="tutorial-video"
            src={`${videoSource(file)}?revision=${revision}`}
            controls
            preload="metadata"
          />
          <div className="ui-inline-actions">
            <Button variant="secondary" onClick={() => void importVideo(index)}>
              Swap video
            </Button>
            <Button variant="danger" onClick={() => onChange(files.filter((_, i) => i !== index))}>
              Delete video
            </Button>
          </div>
        </div>
      ))}
      {files.length < max && (
        <Button className="editor-new-video" variant="secondary" onClick={() => void importVideo()}>
          New video
        </Button>
      )}
      {busy && <p role="status">Importing video?</p>}
      {error && <p role="alert">{error}</p>}
    </fieldset>
  )
}
