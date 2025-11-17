export default function EditProductLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-gray-200 animate-pulse" />
        <div className="flex-1">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="h-16 bg-gray-100 animate-pulse" />
              <div className="p-6 space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1 space-y-6">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="h-16 bg-gray-100 animate-pulse" />
              <div className="p-6">
                <div className="h-12 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

