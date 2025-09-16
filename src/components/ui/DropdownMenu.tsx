import React from 'react'
import { cn } from '@/lib/utils'

interface DropdownMenuProps {
  children: React.ReactNode
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode
  asChild?: boolean
}

interface DropdownMenuContentProps {
  children: React.ReactNode
  align?: 'start' | 'center' | 'end'
  className?: string
}

interface DropdownMenuItemProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  asChild?: boolean
}

const DropdownMenuContext = React.createContext<{
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}>({
  isOpen: false,
  setIsOpen: () => {}
})

export function DropdownMenu({ children }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <DropdownMenuContext.Provider value={{ isOpen, setIsOpen }}>
      <div className="relative">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  )
}

export function DropdownMenuTrigger({ children, asChild }: DropdownMenuTriggerProps) {
  const { setIsOpen } = React.useContext(DropdownMenuContext)

  if (asChild) {
    return React.cloneElement(children as React.ReactElement, {
      onClick: () => setIsOpen(true)
    })
  }

  return (
    <button onClick={() => setIsOpen(true)}>
      {children}
    </button>
  )
}

export function DropdownMenuContent({ children, align = 'end', className }: DropdownMenuContentProps) {
  const { isOpen, setIsOpen } = React.useContext(DropdownMenuContext)

  if (!isOpen) return null

  const alignmentClasses = {
    start: 'left-0',
    center: 'left-1/2 transform -translate-x-1/2',
    end: 'right-0'
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-10" 
        onClick={() => setIsOpen(false)}
      />
      
      {/* Content */}
      <div
        className={cn(
          'absolute z-20 mt-2 w-56 rounded-md border border-gray-200 bg-white py-1 shadow-lg',
          alignmentClasses[align],
          className
        )}
      >
        {children}
      </div>
    </>
  )
}

export function DropdownMenuItem({ children, className, onClick, asChild }: DropdownMenuItemProps) {
  const { setIsOpen } = React.useContext(DropdownMenuContext)

  const handleClick = () => {
    onClick?.()
    setIsOpen(false)
  }

  if (asChild) {
    return React.cloneElement(children as React.ReactElement, {
      onClick: handleClick,
      className: cn(
        'flex cursor-pointer items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100',
        className
      )
    })
  }

  return (
    <div
      className={cn(
        'flex cursor-pointer items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100',
        className
      )}
      onClick={handleClick}
    >
      {children}
    </div>
  )
}
