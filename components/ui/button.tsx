import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-50 border-4 border-black font-black uppercase tracking-tight",
  {
    variants: {
      variant: {
        default: "bg-black text-white hover:bg-zinc-800",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        outline: "border-black bg-white hover:bg-zinc-100 text-black",
        secondary: "bg-zinc-100 text-black hover:bg-zinc-200 border-2",
        ghost: "hover:bg-zinc-100 hover:text-black border-transparent",
        link: "text-black underline-offset-4 hover:underline border-none p-0",
      },
      size: {
        default: "h-12 px-6 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-16 px-10 text-xl",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
