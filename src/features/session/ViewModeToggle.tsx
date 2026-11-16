import { useState } from 'react'
import { SetPinFirstSheet } from './SetPinFirstSheet'
import { useSession } from './session-context'

/** Parent ↔ Child switch, top right of the header (US-03). */
export function ViewModeToggle() {
  const { viewMode, me, switchToChild, setPinPromptOpen } = useSession()
  const [needPin, setNeedPin] = useState(false)
  const child = viewMode === 'child'

  const choose = (target: 'parent' | 'child') => {
    if (target === viewMode) return
    if (target === 'parent') setPinPromptOpen(true)
    else if (!me?.pin_set) setNeedPin(true)
    else switchToChild()
  }

  const segment = (target: 'parent' | 'child', label: string) => {
    const active = viewMode === target
    const activeClass = child ? 'bg-teal-700 text-white px-3.5' : 'bg-primary text-white'
    return (
      <button
        type="button"
        aria-pressed={active}
        onClick={() => choose(target)}
        className={`min-h-9 rounded-full font-extrabold ${child ? 'px-3 text-[13px]' : 'px-2.5 text-[11px]'} ${active ? activeClass : 'text-muted'}`}
      >
        {label}
      </button>
    )
  }

  return (
    <>
      <div
        role="group"
        aria-label="View mode"
        className={`flex rounded-full ${child ? 'bg-white p-1' : 'bg-butter p-0.75'} ${needPin ? 'outline-3 outline-teal-400' : ''}`}
      >
        {segment('parent', 'Parent')}
        {segment('child', 'Child')}
      </div>
      {needPin && <SetPinFirstSheet onClose={() => setNeedPin(false)} />}
    </>
  )
}
