import { useId, type InputHTMLAttributes, type JSX } from 'react'

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  hint?: string
}

export default function TextField({ label, hint, id, ...inputProps }: TextFieldProps): JSX.Element {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const hintId = `${inputId}-hint`

  return (
    <div className="ui-field">
      <label htmlFor={inputId}>{label}</label>

      <input
        {...inputProps}
        id={inputId}
        className="ui-input"
        aria-describedby={hint ? hintId : undefined}
      />

      {hint && (
        <small id={hintId} className="ui-field-hint">
          {hint}
        </small>
      )}
    </div>
  )
}
