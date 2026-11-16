export type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'dark' | 'teal' | 'soft' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 font-extrabold transition-colors disabled:cursor-not-allowed select-none'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover disabled:bg-primary/50',
  outline: 'border-2 border-line-2 bg-white text-ink hover:bg-cream',
  ghost: 'text-muted hover:bg-field',
  dark: 'bg-ink text-white hover:bg-ink/90',
  teal: 'bg-teal-700 text-white hover:bg-teal-900 font-display',
  soft: 'bg-chip text-subtle',
  danger: 'border-2 border-danger-bg text-danger-ink hover:bg-danger-bg/40',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-11 rounded-xl px-4 text-sm',
  md: 'h-13 rounded-2xl px-5 text-base',
  lg: 'h-14 rounded-2xl px-6 text-lg',
}

/** Shared by <Button> and router <Link>s that look like buttons. */
export function buttonClass(variant: ButtonVariant = 'primary', size: ButtonSize = 'lg'): string {
  return `${base} ${variants[variant]} ${sizes[size]}`
}
