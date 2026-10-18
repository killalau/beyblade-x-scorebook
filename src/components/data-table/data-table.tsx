import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import type { ReactNode } from "react";

type DataTableProps<T> = {
  data: T[];
  columns: ColumnDef<T>[];
  getRowId?: (row: T, index: number) => string;
  mobileCard?: (row: T) => ReactNode;
  empty?: ReactNode;
};

export function DataTable<T>({
  data,
  columns,
  getRowId,
  mobileCard,
  empty,
}: DataTableProps<T>) {
  // TanStack Table intentionally returns a stateful table instance; React Compiler skips this hook.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId,
  });
  if (!data.length) return empty ?? null;

  return (
    <>
      {mobileCard && (
        <div className="grid gap-3 md:hidden">
          {data.map((row, index) => (
            <div key={getRowId?.(row, index) ?? String(index)}>
              {mobileCard(row)}
            </div>
          ))}
        </div>
      )}
      <div
        className={
          mobileCard
            ? "hidden overflow-x-auto rounded-xl border border-border bg-card shadow-sm md:block"
            : "overflow-x-auto rounded-xl border border-border bg-card shadow-sm"
        }
      >
        <table className="w-full min-w-[800px] border-collapse text-left text-sm">
          <thead className="bg-muted/70 text-xs tracking-wide text-muted-foreground uppercase">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 font-extrabold">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 align-top">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
