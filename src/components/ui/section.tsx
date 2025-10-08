import * as React from "react"
import { cn } from "@/lib/utils"

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
  spacing?: "default" | "sm" | "lg" | "none"
}

export function Section({ 
  className, 
  children, 
  spacing = "default",
  ...props 
}: SectionProps) {
  const spacingClasses = {
    default: "py-12 md:py-16 lg:py-20",
    sm: "py-8 md:py-10 lg:py-12",
    lg: "py-16 md:py-20 lg:py-24",
    none: "",
  }

  return (
    <section
      className={cn(
        spacingClasses[spacing],
        className
      )}
      {...props}
    >
      {children}
    </section>
  )
}
