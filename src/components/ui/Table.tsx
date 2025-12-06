import React from 'react';
import { clsx } from 'clsx';

interface TableProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  striped?: boolean;
}

export function Table({ children, className, hover = true, striped = false }: TableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
      <table className={clsx('min-w-full divide-y divide-gray-200', className)}>
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
    <thead className={clsx('bg-gradient-to-r from-gray-50 to-gray-100', className)}>
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
    <tbody className={clsx('bg-white divide-y divide-gray-200', className)}>
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
      'transition-all duration-200',
      hover && 'hover:bg-blue-50/50 hover:shadow-sm',
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
      'px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider',
      sortable && 'cursor-pointer hover:text-blue-600 transition-colors',
      className
    )}>
      <div className="flex items-center space-x-1">
        {children}
        {sortable && (
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    <td className={clsx('px-6 py-4 text-sm text-gray-900', className)}>
      {children}
    </td>
  );
}