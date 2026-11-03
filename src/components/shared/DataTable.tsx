'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import { DataTablePagination } from '@/components/shared/DataTablePagination';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { cn } from '@/lib/cn';

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  toolbarSlot?: React.ReactNode;
  showPagination?: boolean;
  pageSize?: number;
  renderCard?: (item: TData) => React.ReactNode;
  asCardOnMobile?: boolean;
  className?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  emptyTitle = 'Tidak ada data',
  emptyDescription = 'Belum ada data yang tercatat di sistem.',
  toolbarSlot,
  showPagination = true,
  pageSize = 10,
  renderCard,
  asCardOnMobile = false,
  className,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  if (isLoading) {
    return <LoadingSkeleton variant="table" count={5} />;
  }

  return (
    <div className={cn('rounded-card border border-border bg-surface overflow-hidden', className)}>
      {/* Integrated Header Toolbar inside the same card */}
      {toolbarSlot && (
        <div className="p-4 border-b border-border bg-surface">
          {toolbarSlot}
        </div>
      )}

      {/* Desktop Table & Optional Mobile Card View */}
      <div>
        {/* Mobile card mode if specified */}
        {asCardOnMobile && renderCard && (
          <div className="grid grid-cols-1 gap-3 p-4 md:hidden">
            {table.getRowModel().rows.length === 0 ? (
              <EmptyState title={emptyTitle} description={emptyDescription} />
            ) : (
              table
                .getRowModel()
                .rows.map((row) => (
                  <div key={row.id}>{renderCard(row.original)}</div>
                ))
            )}
          </div>
        )}

        <div className={cn('w-full overflow-x-auto', asCardOnMobile && 'hidden md:block')}>
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/70 text-xs font-semibold uppercase tracking-wider text-text-primary">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    return (
                      <th
                        key={header.id}
                        className="px-4 py-3.5 font-semibold whitespace-nowrap text-text-primary"
                      >
                        {header.isPlaceholder ? null : canSort ? (
                          <button
                            type="button"
                            onClick={header.column.getToggleSortingHandler()}
                            className="inline-flex items-center gap-1.5 hover:text-text-primary transition-colors focus-ring rounded"
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            <ArrowUpDown className="h-3.5 w-3.5 text-text-neutral" />
                          </button>
                        ) : (
                          flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-border">
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-muted/40 transition-colors duration-150"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 align-middle text-text-primary">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="p-8 text-center text-text-secondary"
                  >
                    <EmptyState
                      title={emptyTitle}
                      description={emptyDescription}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {showPagination && data.length > 0 && (
          <div className="border-t border-border">
            <DataTablePagination table={table} />
          </div>
        )}
      </div>
    </div>
  );
}

