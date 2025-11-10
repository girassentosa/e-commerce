'use client';

import { ReactNode } from 'react';
import { Loader } from '@/components/ui/Loader';

interface Column<T> {
  key: string;
  label: string | ReactNode;
  render?: (item: T) => ReactNode;
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader size="lg" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <p className="text-gray-500 font-medium">{emptyMessage}</p>
      </div>
    );
  }

  // Filter columns for mobile (exclude those with hideOnMobile: true)
  const mobileColumns = columns.filter((col) => !col.hideOnMobile);

  return (
    <>
      {/* Desktop & Tablet Table View with Horizontal Scroll */}
      <div className="hidden sm:block overflow-x-auto -mx-4 sm:mx-0" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className="px-4 sm:px-5 lg:px-6 py-3.5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap"
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {data.map((item, index) => (
                  <tr
                    key={item.id}
                    onClick={() => onRowClick?.(item)}
                    className={`
                      group transition-all duration-200
                      ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                      ${onRowClick ? 'cursor-pointer hover:bg-purple-50 hover:shadow-sm' : ''}
                    `}
                  >
                    {columns.map((column) => (
                      <td 
                        key={column.key} 
                        className="px-4 sm:px-5 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900 group-hover:text-gray-700"
                      >
                        {column.render
                          ? column.render(item)
                          : (item as any)[column.key]?.toString() || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-3">
        {data.map((item) => (
          <div
            key={item.id}
            onClick={() => onRowClick?.(item)}
            className={`
              bg-white border border-gray-200 rounded-xl p-4 shadow-sm
              ${onRowClick ? 'cursor-pointer hover:border-purple-300 hover:shadow-md transition-all duration-200 active:scale-[0.98]' : ''}
            `}
          >
            {mobileColumns.map((column, idx) => {
              const isFirstColumn = idx === 0;
              const isLastColumn = idx === mobileColumns.length - 1;
              const isActionsColumn = column.key === 'actions';
              
              return (
                <div 
                  key={column.key} 
                  className={`
                    ${isFirstColumn ? 'mb-4 pb-4 border-b border-gray-200' : ''}
                    ${!isLastColumn && !isFirstColumn ? 'pb-3 mb-3 border-b border-gray-100' : ''}
                    ${isFirstColumn ? '' : isActionsColumn ? '' : 'flex items-start justify-between gap-3'}
                  `}
                >
                  {isFirstColumn ? (
                    // First column (Product) - Special layout with image
                    <div>
                      {column.render ? column.render(item) : (item as any)[column.key]?.toString() || '-'}
                    </div>
                  ) : isActionsColumn ? (
                    // Actions column - Right aligned, full width untuk mobile
                    <div className="w-full">
                      {column.render
                        ? column.render(item)
                        : (item as any)[column.key]?.toString() || '-'}
                    </div>
                  ) : (
                    <>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide min-w-[80px] shrink-0">
                        {typeof column.label === 'string' ? column.label : column.key}
                      </span>
                      <div className="flex-1 text-right text-sm text-gray-900 font-medium">
                        {column.render
                          ? column.render(item)
                          : (item as any)[column.key]?.toString() || '-'}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}

