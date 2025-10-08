import * as React from "react"
import { cn } from "@/lib/utils"

interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  cols?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: "default" | "sm" | "lg" | "none"
}

export function Grid({ 
  className, 
  children, 
  cols = { default: 1, md: 2, lg: 3 },
  gap = "default",
  ...props 
}: GridProps) {
  const gapClasses = {
    default: "gap-4 md:gap-6 lg:gap-8",
    sm: "gap-2 md:gap-3 lg:gap-4",
    lg: "gap-6 md:gap-8 lg:gap-10",
    none: "gap-0",
  }

  const colClasses = [
    cols.default && `grid-cols-${cols.default}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
  ].filter(Boolean).join(" ")

  return (
    <div
      className={cn(
        "grid",
        colClasses,
        gapClasses[gap],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
