export default function NewProductLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-gray-100 animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 w-64 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
              <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
              {Array.from({ length: 4 }).map((__, i) => (
                <div key={i} className="h-10 w-full bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ))}
        </div>

        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
              {Array.from({ length: 3 }).map((__, i) => (
                <div key={i} className="h-10 w-full bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

