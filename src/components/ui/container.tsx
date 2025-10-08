import * as React from "react"
import { cn } from "@/lib/utils"

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  size?: "default" | "sm" | "lg" | "full"
}

export function Container({ 
  className, 
  children, 
  size = "default",
  ...props 
}: ContainerProps) {
  const sizeClasses = {
    default: "max-w-7xl",
    sm: "max-w-4xl",
    lg: "max-w-[1400px]",
    full: "max-w-full",
  }

  return (
    <div
      className={cn(
        "mx-auto px-4 sm:px-6 lg:px-8",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
