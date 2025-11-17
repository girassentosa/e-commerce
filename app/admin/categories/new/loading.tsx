export default function NewCategoryLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-gray-100 animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 w-52 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className="space-y-2">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-11 w-full bg-gray-100 rounded-lg animate-pulse" />
          </div>
        ))}
        <div className="flex gap-3 pt-4">
          <div className="h-11 w-40 bg-blue-200/70 rounded-lg animate-pulse" />
          <div className="h-11 w-32 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}

