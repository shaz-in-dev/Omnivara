export default function LeadsLoading() {
  return (
    <div className="animate-pulse space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div className="h-7 w-24 rounded-lg bg-gray-200 dark:bg-gray-800" />
        <div className="flex gap-2">
          <div className="h-9 w-28 rounded-lg bg-gray-200 dark:bg-gray-800" />
          <div className="h-9 w-28 rounded-lg bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>
      <div className="rounded-2xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900">
        {/* Table header */}
        <div className="flex gap-4 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          {[120, 160, 100, 80, 90].map((w, i) => (
            <div key={i} className={`h-4 w-${w} rounded bg-gray-200 dark:bg-gray-700`} style={{ width: w }} />
          ))}
        </div>
        {/* Table rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-gray-50 px-4 py-4 last:border-0 dark:border-gray-800/50">
            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-40 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-3 w-28 rounded bg-gray-100 dark:bg-gray-800" />
            </div>
            <div className="h-6 w-20 rounded-full bg-gray-100 dark:bg-gray-800" />
            <div className="h-4 w-24 rounded bg-gray-100 dark:bg-gray-800" />
            <div className="h-4 w-16 rounded bg-gray-100 dark:bg-gray-800" />
          </div>
        ))}
      </div>
    </div>
  );
}
