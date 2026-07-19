export default function AppDetailLoading() {
  return (
    <div className="min-h-screen">
      <div className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <div className="h-6 w-40 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex items-center gap-3">
          <div className="size-12 animate-pulse rounded-xl bg-muted" />
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {["a", "b", "c", "d"].map((key) => (
            <div
              key={key}
              className="h-40 animate-pulse rounded-2xl border border-border bg-muted/40"
            />
          ))}
        </div>
      </main>
    </div>
  );
}
