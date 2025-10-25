/**
 * DeckDetailSkeleton - Loading state for deck detail view
 */

export function DeckDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="mb-6">
        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>

      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        <div className="flex gap-2">
          <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>

      {/* Actions skeleton */}
      <div className="flex flex-wrap gap-3 mb-8">
        <div className="h-10 w-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-10 w-44 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>

      {/* Flashcards section skeleton */}
      <div className="space-y-4">
        <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>

        {/* Desktop table skeleton */}
        <div className="hidden md:block border rounded-lg overflow-hidden">
          <div className="bg-gray-50 dark:bg-gray-800 border-b">
            <div className="flex p-4 gap-4">
              <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex p-4 gap-4 border-b last:border-b-0">
              <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>

        {/* Mobile cards skeleton */}
        <div className="md:hidden space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="flex gap-2">
                <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
