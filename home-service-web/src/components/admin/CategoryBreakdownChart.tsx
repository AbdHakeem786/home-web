interface CategoryRow {
  category: string;
  bookings: number;
}

export default function CategoryBreakdownChart({ data }: { data: CategoryRow[] }) {
  const max = Math.max(1, ...data.map((d) => d.bookings));

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h2 className="mb-3 font-display text-sm font-semibold text-ink">Bookings by category</h2>
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-muted">No booking activity yet.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {data.map((row) => (
            <div key={row.category} className="group rounded-lg px-1 py-1 transition-colors hover:bg-surface">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-ink">{row.category}</span>
                <span className="text-ink-muted">{row.bookings}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${(row.bookings / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
