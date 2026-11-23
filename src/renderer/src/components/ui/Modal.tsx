import { useEffect, useId, useRef, type JSX, type ReactNode } from 'react'

type ModalProps = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

export default function Modal({ open, title, onClose, children }: ModalProps): JSX.Element {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current

    if (!dialog) return

    if (open && !dialog.open) {
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      className="ui-modal"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
    >
      <div className="ui-modal-header">
        <h2 id={titleId}>{title}</h2>

        <button
          type="button"
          className="ui-modal-close"
          aria-label="Close dialog"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <div className="ui-modal-content">{children}</div>
    </dialog>
  )
}
