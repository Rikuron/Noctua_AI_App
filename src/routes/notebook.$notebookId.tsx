import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/notebook/$notebookId')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/notebook/$notebookId"!</div>
}
