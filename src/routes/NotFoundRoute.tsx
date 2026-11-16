import { Link } from 'react-router'
import { buttonClass } from '../components/ui/buttonStyles'
import { EmptyState } from '../components/ui/States'

export default function NotFoundRoute() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center p-6">
      <EmptyState
        title="This page wandered off"
        body="Let’s go back to the library."
        action={
          <Link to="/" className={`${buttonClass('primary', 'md')} w-full`}>
            Go to Home
          </Link>
        }
      />
    </main>
  )
}
