export function PageLoading({ label = "Laden..." }: { label?: string }) {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="animate-pulse space-y-5">
            <div className="h-5 w-48 rounded bg-slate-200" />
            <div className="h-4 w-72 max-w-full rounded bg-slate-200" />

            <div className="grid gap-4 md:grid-cols-4">
              <div className="h-24 rounded-xl bg-slate-100" />
              <div className="h-24 rounded-xl bg-slate-100" />
              <div className="h-24 rounded-xl bg-slate-100" />
              <div className="h-24 rounded-xl bg-slate-100" />
            </div>

            <div className="h-56 rounded-xl bg-slate-100" />
          </div>

          <p className="mt-6 text-sm text-slate-500">{label}</p>
        </div>
      </div>
    </main>
  );
}
