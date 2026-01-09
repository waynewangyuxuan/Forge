function App() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary-600">Forge</h1>
        <p className="mt-2 text-neutral-500">AI-powered project generator</p>
        <div className="mt-8 rounded-lg bg-white p-6 shadow-sm">
          <p className="text-sm text-neutral-600">
            Ready to build. Check{' '}
            <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-xs">
              META/MILESTONES/
            </code>{' '}
            for development progress.
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
