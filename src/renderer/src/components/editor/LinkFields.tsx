import type { JSX } from 'react'
import Button from '../ui/Button'
import TextField from '../ui/TextField'

type Props = { links: string[]; onChange: (links: string[]) => void }

export default function LinkFields({ links, onChange }: Props): JSX.Element {
  return (
    <div className="editor-form">
      {links.map((link, index) => (
        <div className="attachment-row" key={index}>
          <TextField
            label={`Website URL ${index + 1}`}
            type="url"
            required
            value={link}
            onChange={(event) =>
              onChange(links.map((value, i) => (i === index ? event.target.value : value)))
            }
          />
          <Button variant="danger" onClick={() => onChange(links.filter((_, i) => i !== index))}>
            Remove link
          </Button>
        </div>
      ))}
      <Button
        variant="secondary"
        disabled={links.length >= 10}
        onClick={() => onChange([...links, ''])}
      >
        Add link
      </Button>
    </div>
  )
}
