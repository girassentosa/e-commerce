export default function AdminCategoriesLoading() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
          <div className="h-6 w-56 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="p-6 space-y-4">
          <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
          <div className="h-10 w-32 bg-blue-200/70 rounded-lg animate-pulse" />
        </div>
      </div>

      <div className="admin-filter-card">
        <div className="admin-card-header">
          <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="p-4 sm:p-6 space-y-4">
          <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-10 w-32 bg-gray-100 rounded-full animate-pulse" />
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
    </div>
  );
}

