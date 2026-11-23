import { useId, type JSX, type SelectHTMLAttributes } from 'react'

type SelectOption = {
  value: string
  label: string
}

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  options: SelectOption[]
}

export default function SelectField({
  label,
  options,
  id,
  ...selectProps
}: SelectFieldProps): JSX.Element {
  const generatedId = useId()
  const selectId = id ?? generatedId

  return (
    <div className="ui-field">
      <label htmlFor={selectId}>{label}</label>

      <select {...selectProps} id={selectId} className="ui-select">
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
