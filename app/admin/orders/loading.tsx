export default function AdminOrdersLoading() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-50 via-white to-purple-50 px-6 py-4 border-b border-gray-200">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="p-6 space-y-4">
          <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-24 bg-gray-100 rounded-xl border border-gray-200 animate-pulse" />
            ))}
          </div>
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

