import { useId, type JSX, type KeyboardEvent, type ReactNode } from 'react'

export type TabItem = {
  id: string
  label: string
  content: ReactNode
}

type TabsProps = {
  label: string
  items: TabItem[]
  value: string
  onChange: (value: string) => void
}

export default function Tabs({ label, items, value, onChange }: TabsProps): JSX.Element {
  const baseId = useId()
  const selectedIndex = Math.max(
    0,
    items.findIndex((item) => item.id === value)
  )

  const selectedItem = items[selectedIndex]

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number): void {
    let nextIndex: number

    if (event.key === 'ArrowRight') {
      nextIndex = (index + 1) % items.length
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (index - 1 + items.length) % items.length
    } else if (event.key === 'Home') {
      nextIndex = 0
    } else if (event.key === 'End') {
      nextIndex = items.length - 1
    } else {
      return
    }

    event.preventDefault()

    const nextTab = items[nextIndex]
    if (!nextTab) return

    onChange(nextTab.id)

    const buttons =
      event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')

    buttons?.[nextIndex]?.focus()
  }

  return (
    <div className="ui-tabs">
      <div className="ui-tabs-list" role="tablist" aria-label={label}>
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`${baseId}-tab-${index}`}
            aria-controls={`${baseId}-panel`}
            aria-selected={index === selectedIndex}
            tabIndex={index === selectedIndex ? 0 : -1}
            onClick={() => onChange(item.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div
        id={`${baseId}-panel`}
        className="ui-tabs-panel"
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${selectedIndex}`}
        tabIndex={0}
      >
        {selectedItem?.content}
      </div>
    </div>
  )
}
