import { Compass } from 'lucide-react'

import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { navigate } from '../lib/router'
import { PageShell } from './PageShell'

export function NotFound({ message = 'That page is not part of the planner.' }: { message?: string }) {
  return (
    <PageShell>
      <div className="mt-[10vh] rounded-column bg-column shadow-[inset_0_0_0_1px_var(--color-column-edge)]">
        <EmptyState
          tone="dark"
          as="h1"
          icon={<Compass />}
          title="Nothing here"
          body={message}
          actions={
            <Button variant="pill" onClick={() => navigate('/')}>
              Back to the planner
            </Button>
          }
        />
      </div>
    </PageShell>
  )
}
