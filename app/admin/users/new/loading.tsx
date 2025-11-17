export default function NewUserLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="fixed top-0 left-0 right-0 z-[100] bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between h-14 sm:h-16 px-4 sm:px-6 w-full">
          <div className="h-10 w-10 rounded-lg bg-gray-200 animate-pulse" />
          <div className="flex-1 mx-4 h-6 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-10 rounded-lg bg-gray-200 animate-pulse" />
        </div>
      </header>

      <div className="min-h-screen pt-14 sm:pt-16">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <div className="max-w-2xl">
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="h-16 bg-gray-100 animate-pulse" />
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-20 bg-gray-100 rounded animate-pulse" />
                  <div className="h-20 bg-gray-100 rounded animate-pulse" />
                </div>
                {Array.from({ length: 5 }).map((_, idx) => (
                  <div key={idx} className="h-20 bg-gray-100 rounded animate-pulse" />
                ))}
                <div className="h-12 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

