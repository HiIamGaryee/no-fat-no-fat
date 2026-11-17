import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva("inline-flex min-h-11 items-center justify-center border-2 border-ink px-6 font-bold uppercase transition-transform focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue/40 disabled:pointer-events-none disabled:opacity-50 active:translate-x-1 active:translate-y-1", {
  variants: {
    variant: {
      default: "bg-pink text-ink shadow-[5px_5px_0_var(--ink)] hover:-translate-y-1",
      ink: "bg-ink text-white shadow-[5px_5px_0_var(--pink)] hover:-translate-y-1",
      ghost: "bg-transparent text-ink hover:bg-white/30",
    },
    size: { default: "h-12", lg: "h-14 px-8 text-lg", icon: "h-11 w-11 p-0" },
  }, defaultVariants: { variant: "default", size: "default" },
});

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants> & { asChild?: boolean };

export const Button = ({ className, variant, size, asChild, ...props }: ButtonProps) => {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
};
