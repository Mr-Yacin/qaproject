import * as React from "react"
import { cn } from "@/lib/utils"

interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  spacing?: "default" | "sm" | "lg" | "xl" | "none"
  direction?: "vertical" | "horizontal"
}

export function Stack({ 
  className, 
  children, 
  spacing = "default",
  direction = "vertical",
  ...props 
}: StackProps) {
  const spacingClasses = {
    vertical: {
      default: "space-y-4",
      sm: "space-y-2",
      lg: "space-y-6",
      xl: "space-y-8",
      none: "space-y-0",
    },
    horizontal: {
      default: "space-x-4",
      sm: "space-x-2",
      lg: "space-x-6",
      xl: "space-x-8",
      none: "space-x-0",
    },
  }

  const directionClass = direction === "horizontal" ? "flex flex-row" : "flex flex-col"

  return (
    <div
      className={cn(
        directionClass,
        spacingClasses[direction][spacing],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
