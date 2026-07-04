import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_12px_32px_rgba(124,58,237,0.28)] hover:bg-primary/90 hover:-translate-y-0.5",
        primary:
          "bg-primary text-primary-foreground shadow-[0_12px_32px_rgba(124,58,237,0.28)] hover:bg-primary/90 hover:-translate-y-0.5",
        secondary:
          "bg-secondary/15 text-secondary border border-secondary/20 shadow-sm hover:bg-secondary/25 hover:-translate-y-0.5",
        ghost: "text-muted-foreground border border-transparent hover:border-white/10 hover:bg-white/5 hover:text-foreground",
        danger:
          "bg-destructive/15 text-destructive border border-destructive/30 shadow-sm hover:bg-destructive/25",
        destructive:
          "bg-destructive/15 text-destructive border border-destructive/30 shadow-sm hover:bg-destructive/25",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-xl px-3 text-xs",
        lg: "h-12 rounded-2xl px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
