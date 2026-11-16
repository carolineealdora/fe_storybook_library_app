import { useId, type InputHTMLAttributes } from 'react'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  invalid?: boolean
  hint?: string
}

export function TextField({
  label,
  invalid,
  hint,
  className = '',
  readOnly,
  ...rest
}: TextFieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-bold text-muted">
        {label}
      </label>
      <input
        id={id}
        readOnly={readOnly}
        aria-invalid={invalid || undefined}
        aria-describedby={hint ? hintId : undefined}
        className={`h-13 rounded-xl border-2 px-4 text-base font-semibold outline-none focus-visible:border-primary ${
          readOnly
            ? 'border-transparent bg-field text-subtle'
            : invalid
              ? 'border-primary bg-white'
              : 'border-line-2 bg-white'
        } ${className}`}
        {...rest}
      />
      {hint && (
        <p id={hintId} className="text-xs font-semibold text-muted">
          {hint}
        </p>
      )}
    </div>
  )
}
