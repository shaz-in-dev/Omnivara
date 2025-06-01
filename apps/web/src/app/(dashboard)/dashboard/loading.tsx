export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-48 rounded-lg bg-gray-200 dark:bg-gray-800" />
        <div className="h-9 w-32 rounded-lg bg-gray-200 dark:bg-gray-800" />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-3 flex items-center justify-between">
              <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-8 w-8 rounded-xl bg-gray-100 dark:bg-gray-800" />
            </div>
            <div className="h-7 w-20 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="mt-2 h-3 w-16 rounded bg-gray-100 dark:bg-gray-800" />
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-gray-100 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 h-5 w-40 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-48 w-full rounded-xl bg-gray-100 dark:bg-gray-800" />
          </div>
        ))}
      </div>
    </div>
  );
}
