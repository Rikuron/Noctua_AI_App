import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/test-route')({
  component: TestComponent,
})

function TestComponent() {
  return (
    <div className="min-h-screen bg-green-500 text-black p-8">
      <h1 className="text-4xl font-bold">TEST ROUTE WORKING!</h1>
      <p>This is a test route to verify routing works</p>
    </div>
  )
}