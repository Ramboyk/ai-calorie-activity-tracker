import React from "react";
import { cn } from "@/lib/utils/cn";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "water" | "calorie" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-hover active:bg-[#005137] shadow-sm shadow-primary/20 focus-visible:ring-primary/40",
  water:
    "bg-water text-white hover:bg-water-hover active:bg-[#004b73] shadow-sm shadow-water/20 focus-visible:ring-water/40",
  calorie:
    "bg-calorie text-white hover:bg-calorie-hover active:bg-[#653e00] shadow-sm shadow-calorie/20 focus-visible:ring-calorie/40",
  outline:
    "border border-[#eaedff] bg-surface-container-lowest text-app-text-main hover:bg-surface-container-low hover:border-outline-variant active:bg-surface-container focus-visible:ring-primary/30",
  ghost:
    "bg-transparent text-app-text-main hover:bg-surface-container-low active:bg-surface-container focus-visible:ring-primary/30",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-11 min-h-[44px] min-w-[44px] px-3.5 text-xs font-semibold rounded-xl gap-1.5",
  md: "h-11 min-h-[44px] min-w-[44px] px-5 text-sm font-semibold rounded-2xl gap-2",
  lg: "h-12 min-h-[48px] min-w-[48px] px-6 text-base font-bold rounded-2xl gap-2.5",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      type = "button",
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={cn(
          "inline-flex items-center justify-center font-medium tracking-tight select-none",
          "transition-all duration-150 ease-in-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
          "disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none",
          "active:scale-[0.98]",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
        ) : (
          leftIcon && <span className="inline-flex shrink-0 items-center justify-center">{leftIcon}</span>
        )}
        {children && <span>{children}</span>}
        {!isLoading && rightIcon && (
          <span className="inline-flex shrink-0 items-center justify-center">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
