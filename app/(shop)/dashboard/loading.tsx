export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="h-10 w-10 rounded-lg bg-gray-200 animate-pulse" />
            <div className="flex-1 mx-4 h-6 bg-gray-200 rounded animate-pulse" />
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-gray-200 animate-pulse" />
              <div className="h-10 w-10 rounded-lg bg-gray-200 animate-pulse" />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-2 sm:px-3 md:px-4 pt-4 pb-4 sm:pb-6 md:pb-8 space-y-4">
        <div className="w-full h-32 rounded-xl bg-gray-100 animate-pulse" />
        <div className="w-full rounded-xl border border-gray-200 p-4 space-y-4">
          <div className="h-5 w-32 bg-gray-100 rounded animate-pulse" />
          <div className="flex gap-4 overflow-x-auto">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="w-20 h-20 rounded-lg bg-gray-100 animate-pulse" />
            ))}
          </div>
        </div>
        <div className="w-full rounded-xl border border-gray-200 p-4 space-y-4">
          <div className="h-5 w-28 bg-gray-100 rounded animate-pulse" />
          <div className="flex gap-4 overflow-x-auto">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="flex-1 h-16 rounded-lg bg-gray-100 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

