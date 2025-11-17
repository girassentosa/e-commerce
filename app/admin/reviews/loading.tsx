export default function AdminReviewsLoading() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-amber-50 via-white to-blue-50 px-6 py-4 border-b border-gray-200">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="p-6 space-y-4">
          <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
          </div>
          <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </div>

      <div className="admin-table-card space-y-3">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="h-16 w-full rounded-lg bg-gray-100 border border-gray-200 animate-pulse"
          />
        ))}
      </div>

      <div className="flex justify-center">
        <div className="h-10 w-48 bg-gray-100 rounded-full animate-pulse" />
      </div>
    </div>
  );
}

