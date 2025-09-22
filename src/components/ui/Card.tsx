import React from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  className?: string
}

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  className?: string
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm',
        className
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: CardHeaderProps) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    />
  )
}

export function CardTitle({ className, ...props }: CardTitleProps) {
  return (
    <h3
      className={cn(
        'text-2xl font-semibold leading-none tracking-tight',
        className
      )}
      {...props}
    />
  )
}

export function CardDescription({ className, ...props }: CardDescriptionProps) {
  return (
    <p
      className={cn('text-sm text-gray-600 dark:text-gray-400', className)}
      {...props}
    />
  )
}

export function CardContent({ className, ...props }: CardContentProps) {
  return <div className={cn('p-6 pt-0', className)} {...props} />
}

export function CardFooter({ className, ...props }: CardFooterProps) {
  return (
    <div
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    />
  )
}

export function CardBody({ className, ...props }: CardBodyProps) {
  return <div className={cn('p-6', className)} {...props} />
}