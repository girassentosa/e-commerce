export default function AdminSettingsLoading() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
          <div className="h-6 w-44 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-6">
          {Array.from({ length: 7 }).map((_, idx) => (
            <div key={idx} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>

      <div className="flex justify-end">
        <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}

