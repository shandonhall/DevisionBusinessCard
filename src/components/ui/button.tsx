import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--brand-background)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Important text colours so parent muted utilities cannot wash out labels.
        default:
          "bg-[var(--brand-primary)] text-white! hover:opacity-90 shadow-sm",
        secondary:
          "bg-[var(--brand-surface)] text-[var(--brand-text)]! border border-[var(--brand-border)] hover:bg-[var(--brand-hover)]",
        outline:
          "border border-[var(--brand-border-strong)] bg-transparent hover:bg-[var(--brand-hover)] text-[var(--brand-text)]!",
        ghost:
          "hover:bg-[var(--brand-hover)] text-[var(--brand-text)]!",
        link: "text-[var(--brand-primary)]! underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-lg px-6",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
