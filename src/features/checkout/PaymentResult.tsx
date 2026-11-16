import { useEffect, useRef, type ReactNode } from 'react'

interface PaymentResultProps {
  kind: 'success' | 'failed'
  title: string
  body: string
  children: ReactNode
}

/** A6 / A7: full-screen payment outcome. */
export function PaymentResult({ kind, title, body, children }: PaymentResultProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => headingRef.current?.focus(), [])
  const ok = kind === 'success'
  return (
    <main className="flex min-h-dvh flex-col items-center bg-white px-7 pt-[max(env(safe-area-inset-top),7.5rem)] pb-8 text-center">
      <div className="flex w-full max-w-md flex-1 flex-col items-center gap-5">
        <div
          className={`flex size-30 items-center justify-center rounded-full ${ok ? 'bg-teal-50' : 'bg-danger-bg'}`}
        >
          <span
            aria-hidden="true"
            className={`flex size-18 items-center justify-center rounded-full text-4xl font-extrabold text-white ${ok ? 'bg-teal-400' : 'bg-primary'}`}
          >
            {ok ? '✓' : '!'}
          </span>
        </div>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="font-display text-[28px] leading-tight font-extrabold outline-none"
        >
          {title}
        </h1>
        <p className="text-[15px] leading-normal font-semibold text-pretty text-muted">{body}</p>
        <div className="mt-auto flex w-full flex-col gap-2.5">{children}</div>
      </div>
    </main>
  )
}
