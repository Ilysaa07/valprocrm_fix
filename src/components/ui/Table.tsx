import React from 'react'
import { cn } from '@/lib/utils'

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  className?: string
}

interface TableHeaderProps extends React.TableHTMLAttributes<HTMLTableSectionElement> {
  className?: string
}

interface TableBodyProps extends React.TableHTMLAttributes<HTMLTableSectionElement> {
  className?: string
}

interface TableRowProps extends React.TableHTMLAttributes<HTMLTableRowElement> {
  className?: string
}

interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  className?: string
}

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  className?: string
}

export function Table({ className, ...props }: TableProps) {
  return (
    <div className="relative w-full overflow-auto">
      <table
        className={cn('w-full caption-bottom text-sm text-gray-900 dark:text-gray-100', className)}
        {...props}
      />
    </div>
  )
}

export function TableHeader({ className, ...props }: TableHeaderProps) {
  return (
    <thead className={cn('[&_tr]:border-b bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-700', className)} {...props} />
  )
}

export function TableBody({ className, ...props }: TableBodyProps) {
  return (
    <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />
  )
}

export function TableRow({ className, ...props }: TableRowProps) {
  return (
    <tr
      className={cn(
        'border-b border-gray-200 dark:border-gray-700 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700',
        className
      )}
      {...props}
    />
  )
}

export function TableHead({ className, ...props }: TableHeadProps) {
  return (
    <th
      className={cn(
        'h-12 px-4 text-left align-middle font-medium text-gray-500 dark:text-gray-300',
        className
      )}
      {...props}
    />
  )
}

export function TableCell({ className, ...props }: TableCellProps) {
  return (
    <td
      className={cn('p-4 align-middle text-gray-900 dark:text-gray-100', className)}
      {...props}
    />
  )
}
