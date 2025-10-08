import * as React from "react"
import { cn } from "@/lib/utils"

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
}

export function H1({ className, children, ...props }: TypographyProps) {
  return (
    <h1
      className={cn(
        "text-4xl md:text-5xl font-bold leading-tight tracking-tight",
        className
      )}
      {...props}
    >
      {children}
    </h1>
  )
}

export function H2({ className, children, ...props }: TypographyProps) {
  return (
    <h2
      className={cn(
        "text-3xl md:text-4xl font-bold leading-tight tracking-tight",
        className
      )}
      {...props}
    >
      {children}
    </h2>
  )
}

export function H3({ className, children, ...props }: TypographyProps) {
  return (
    <h3
      className={cn(
        "text-2xl md:text-3xl font-semibold leading-snug tracking-tight",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  )
}

export function H4({ className, children, ...props }: TypographyProps) {
  return (
    <h4
      className={cn(
        "text-xl md:text-2xl font-semibold leading-snug tracking-tight",
        className
      )}
      {...props}
    >
      {children}
    </h4>
  )
}

export function Body({ className, children, ...props }: TypographyProps) {
  return (
    <p
      className={cn("text-base leading-relaxed", className)}
      {...props}
    >
      {children}
    </p>
  )
}

export function Small({ className, children, ...props }: TypographyProps) {
  return (
    <small
      className={cn("text-sm leading-normal", className)}
      {...props}
    >
      {children}
    </small>
  )
}

export function Lead({ className, children, ...props }: TypographyProps) {
  return (
    <p
      className={cn("text-lg md:text-xl leading-relaxed text-muted-foreground", className)}
      {...props}
    >
      {children}
    </p>
  )
}

export function Muted({ className, children, ...props }: TypographyProps) {
  return (
    <p
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    >
      {children}
    </p>
  )
}
