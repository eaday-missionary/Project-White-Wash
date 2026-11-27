import type { JSX } from 'react'
import Button from '../ui/Button'
import TextField from '../ui/TextField'
import LinkFields from './LinkFields'
import type { SoftwareResource } from '../../types/resources'

type SoftwareFormProps = {
  softwareDraft: SoftwareResource
  setSoftwareDraft: (draft: SoftwareResource | null) => void
  saveSoftware: () => Promise<void>
  saving: boolean
}

export default function SoftwareForm({
  softwareDraft,
  setSoftwareDraft,
  saveSoftware,
  saving
}: SoftwareFormProps): JSX.Element {
  return (
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

      <LinkFields
        links={softwareDraft.links ?? [softwareDraft.url]}
        onChange={(links) => setSoftwareDraft({ ...softwareDraft, links, url: links[0] ?? '' })}
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
  )
}
