import * as React from "react"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const cardVariants = cva(
  "rounded-2xl border bg-card/90 text-card-foreground shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-white/10",
        hover: "border-white/10 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-white/[0.055]",
        interactive: "border-white/10 cursor-pointer hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/10",
        selected: "border-primary/80 bg-primary/15",
        danger: "border-destructive/50 bg-destructive/10",
        dashboard: "border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.18),transparent_32%),rgba(255,255,255,0.035)]",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

const Card = React.forwardRef(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(cardVariants({ variant, className }))}
    {...props} />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("text-xl font-semibold leading-none tracking-[-0.03em]", className)} {...props} />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("text-sm leading-6 text-muted-foreground", className)} {...props} />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants }
