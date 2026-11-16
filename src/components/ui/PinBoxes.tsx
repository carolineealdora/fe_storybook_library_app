import { useId } from 'react'

interface PinBoxesProps {
  label: string
  value: string
  onChange: (value: string) => void
  invalid?: boolean
  autoFocus?: boolean
}

const LENGTH = 4

/** B5: one real numeric input drawn as four boxes, so typing, paste and screen readers just work. */
export function PinBoxes({ label, value, onChange, invalid, autoFocus }: PinBoxesProps) {
  const id = useId()
  return (
    <div className="flex flex-col gap-2.5">
      <label htmlFor={id} className="text-sm font-extrabold">
        {label}
      </label>
      <div className="relative w-fit">
        <input
          id={id}
          type="password"
          inputMode="numeric"
          autoComplete="off"
          maxLength={LENGTH}
          value={value}
          aria-invalid={invalid || undefined}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, LENGTH))}
          className="peer absolute inset-0 z-10 size-full cursor-text opacity-0"
        />
        <div
          aria-hidden="true"
          className="flex gap-3 rounded-2xl peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-teal-400"
        >
          {Array.from({ length: LENGTH }, (_, i) => (
            <span
              key={i}
              className={`flex h-16 w-15 items-center justify-center rounded-2xl border-2 text-[26px] font-extrabold ${
                i < value.length || invalid ? 'border-primary' : 'border-line-2'
              }`}
            >
              {i < value.length ? '•' : ''}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
