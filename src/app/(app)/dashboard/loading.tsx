export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 lg:py-14" role="status" aria-busy="true" aria-label="Loading your dashboard">
      <div className="skeleton h-10 w-2/3 max-w-md" />
      <div className="skeleton mt-4 h-6 w-1/2 max-w-xs" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-28" />
        ))}
      </div>
      <div className="skeleton mt-12 h-6 w-48" />
      <div className="mt-4 grid gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-16" />
        ))}
      </div>
    </div>
  );
}
