import { useMemo, useState, type JSX } from 'react'
import { RadialMenu } from './RadialMenu'
import type { RadialMenuItem } from './radialMenu.types'
import './RadialMenuPlayground.css'

export default function RadialMenuPlayground(): JSX.Element {
  const [ids, setIds] = useState([1, 2, 3])
  const [selected, setSelected] = useState('None')
  const [disabled, setDisabled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const items = useMemo<RadialMenuItem[]>(
    () =>
      ids.map((id, index) => ({
        id: String(id),
        label: `Feature ${id}`,
        icon: <span>{'\u25c7'}</span>,
        disabled: index === 0 && disabled,
        hidden: index === 1 && hidden,
        onSelect: () => setSelected(String(id))
      })),
    [ids, disabled, hidden]
  )
  return (
    <div className="radial-playground">
      <div className="radial-playground-controls">
        <button disabled={ids.length >= 12} onClick={() => setIds([...ids, Math.max(...ids) + 1])}>
          Add
        </button>
        <button disabled={ids.length <= 3} onClick={() => setIds(ids.slice(0, -1))}>
          Remove
        </button>
        <button onClick={() => setIds([...ids.slice(1), ids[0]])}>Reorder</button>
        <button
          onClick={() => {
            setIds([1, 2, 3])
            setSelected('None')
            setDisabled(false)
            setHidden(false)
          }}
        >
          Reset
        </button>
        <label>
          <input
            type="checkbox"
            checked={disabled}
            onChange={(event) => setDisabled(event.target.checked)}
          />
          Disable first
        </label>
        <label>
          <input
            type="checkbox"
            checked={hidden}
            onChange={(event) => setHidden(event.target.checked)}
          />
          Hide second
        </label>
        <span>
          {ids.length} items / Selected: {selected}
        </span>
      </div>
      <div className="radial-playground-preview">
        <RadialMenu
          items={items}
          hub={
            <>
              Radial playground
              <br />
              Resize this panel
            </>
          }
        />
      </div>
    </div>
  )
}
