import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cor-principal-clara)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--cor-background)]",
  {
    variants: {
      variant: {
        default: "bg-[var(--cor-principal)] text-[#1a0d08]",
        outline: "border border-[var(--cor-bordas)] bg-transparent text-[var(--cor-fonte)]",
        unstyled: "",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, type = "button", ...props }, ref) => (
  <button ref={ref} type={type} className={cn(buttonVariants({ variant }), className)} {...props} />
));

Button.displayName = "Button";

export { Button, buttonVariants };
