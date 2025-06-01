export default function HelpdeskLoading() {
  return (
    <div className="animate-pulse space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div className="h-7 w-32 rounded-lg bg-gray-200 dark:bg-gray-800" />
        <div className="h-9 w-36 rounded-lg bg-gray-200 dark:bg-gray-800" />
      </div>
      {/* Status tabs */}
      <div className="flex gap-2">
        {[80, 70, 90, 75].map((w, i) => (
          <div key={i} className="h-8 rounded-lg bg-gray-100 dark:bg-gray-800" style={{ width: w }} />
        ))}
      </div>
      {/* Ticket rows */}
      <div className="rounded-2xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-gray-50 px-4 py-4 last:border-0 dark:border-gray-800/50">
            <div className="h-6 w-6 rounded bg-gray-100 dark:bg-gray-800" />
            <div className="flex-1">
              <div className="mb-1.5 h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-3 w-1/2 rounded bg-gray-100 dark:bg-gray-800" />
            </div>
            <div className="h-6 w-16 rounded-full bg-gray-100 dark:bg-gray-800" />
            <div className="h-6 w-14 rounded-full bg-gray-100 dark:bg-gray-800" />
            <div className="h-4 w-20 rounded bg-gray-100 dark:bg-gray-800" />
          </div>
        ))}
      </div>
    </div>
  );
}
