import React from 'react';
import { clsx } from 'clsx';

interface TableProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  striped?: boolean;
}

export function Table({ children, className, hover: _hover, striped: _striped }: TableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className={clsx('min-w-full divide-y divide-gray-100', className)}>
        {children}
      </table>
    </div>
  );
}

interface TableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function TableHeader({ children, className }: TableHeaderProps) {
  return (
    <thead className={clsx('bg-gray-50', className)}>
      {children}
    </thead>
  );
}

interface TableBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function TableBody({ children, className }: TableBodyProps) {
  return (
    <tbody className={clsx('bg-white divide-y divide-gray-100', className)}>
      {children}
    </tbody>
  );
}

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function TableRow({ children, className, hover = true }: TableRowProps) {
  return (
    <tr className={clsx(
      'transition-colors duration-100',
      hover && 'hover:bg-gray-50',
      className
    )}>
      {children}
    </tr>
  );
}

interface TableHeadProps {
  children: React.ReactNode;
  className?: string;
  sortable?: boolean;
}

export function TableHead({ children, className, sortable = false }: TableHeadProps) {
  return (
    <th className={clsx(
      'px-4 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider',
      sortable && 'cursor-pointer hover:text-blue-600 transition-colors',
      className
    )}>
      <div className="flex items-center gap-1">
        {children}
        {sortable && (
          <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        )}
      </div>
    </th>
  );
}

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
}

export function TableCell({ children, className }: TableCellProps) {
  return (
    <td className={clsx('px-4 py-3 text-[13px] text-gray-700', className)}>
      {children}
    </td>
  );
}
