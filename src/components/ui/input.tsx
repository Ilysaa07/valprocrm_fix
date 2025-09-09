import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-text-primary placeholder:text-text-muted selection:bg-accent selection:text-text-inverse flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "border-border bg-card text-text-primary placeholder-text-muted",
        "focus-visible:border-accent focus-visible:ring-accent/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-error/20 aria-invalid:border-error",
        className
      )}
      {...props}
    />
  )
}

export { Input }
