export default function AdminProfileLoading() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="p-6 space-y-2">
          <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="admin-card space-y-4">
          <div className="admin-card-header">
            <div className="h-5 w-44 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full bg-gray-200 animate-pulse" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="h-10 rounded-lg bg-gray-100 animate-pulse" />
              ))}
            </div>
          </div>
        </div>

        <div className="admin-card space-y-4">
          <div className="admin-card-header">
            <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="p-4 sm:p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="h-10 rounded-lg bg-gray-100 animate-pulse" />
            ))}
          </div>
        </div>
      </div>

      <div className="admin-card space-y-4">
        <div className="admin-card-header">
          <div className="h-5 w-36 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="p-4 sm:p-6 space-y-3">
          <div className="h-10 rounded-lg bg-gray-100 animate-pulse" />
          <div className="h-24 rounded-xl bg-gray-50 border border-gray-100 animate-pulse" />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />
        <div className="h-10 w-full sm:w-48 bg-blue-200/70 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}

