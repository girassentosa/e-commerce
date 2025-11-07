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
      <div className="flex justify-center items-center py-12">
        <Loader size="lg" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  // Filter columns for mobile (exclude those with hideOnMobile: true)
  const mobileColumns = columns.filter((col) => !col.hideOnMobile);

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="text-left px-4 lg:px-6 py-3 text-sm font-semibold text-gray-700"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr
                key={item.id}
                onClick={() => onRowClick?.(item)}
                className={`
                  border-b border-gray-100 hover:bg-gray-50 transition-colors
                  ${onRowClick ? 'cursor-pointer' : ''}
                `}
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-4 lg:px-6 py-4 text-sm text-gray-900">
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

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {data.map((item) => (
          <div
            key={item.id}
            onClick={() => onRowClick?.(item)}
            className={`
              bg-white border border-gray-200 rounded-lg p-4 space-y-3
              ${onRowClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
            `}
          >
            {mobileColumns.map((column) => (
              <div key={column.key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                <span className="text-xs font-semibold text-gray-500 uppercase sm:w-24">
                  {typeof column.label === 'string' ? column.label : column.key}
                </span>
                <div className="flex-1 text-sm text-gray-900">
                  {column.render
                    ? column.render(item)
                    : (item as any)[column.key]?.toString() || '-'}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

