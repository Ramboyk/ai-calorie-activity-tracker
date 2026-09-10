import React from "react";
import { cn } from "@/lib/utils/cn";

export type BadgeVariant =
  | "primary"
  | "water"
  | "calorie"
  | "protein"
  | "carbs"
  | "fat"
  | "neutral"
  | "outline";

export type AIConfidenceLevel = "high" | "medium" | "low";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  confidence?: AIConfidenceLevel;
  showDot?: boolean;
  leftIcon?: React.ReactNode;
  children?: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  primary: "bg-primary-soft text-primary border border-primary/20",
  water: "bg-water-soft text-water border border-water/20",
  calorie: "bg-calorie-soft text-calorie border border-calorie/20",
  protein: "bg-indigo-50 text-indigo-700 border border-indigo-200/60",
  carbs: "bg-amber-50 text-amber-700 border border-amber-200/60",
  fat: "bg-rose-50 text-rose-700 border border-rose-200/60",
  neutral: "bg-surface-container text-app-text-muted border border-surface-container-high",
  outline: "bg-transparent text-app-text-main border border-outline-variant",
};

const confidenceStyles: Record<AIConfidenceLevel, { badge: string; dot: string; label: string }> = {
  high: {
    badge: "bg-[#ecfdf5] text-[#006948] border border-[#85f8c4]/60",
    dot: "bg-[#006948]",
    label: "Yüksek Güven",
  },
  medium: {
    badge: "bg-[#fffbeb] text-[#825100] border border-[#ffb95f]/60",
    dot: "bg-[#f59e0b]",
    label: "Orta Güven",
  },
  low: {
    badge: "bg-[#fef2f2] text-[#ba1a1a] border border-[#fca5a5]/60",
    dot: "bg-[#ba1a1a]",
    label: "Düşük Güven",
  },
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant = "neutral",
      confidence,
      showDot = false,
      leftIcon,
      children,
      ...props
    },
    ref
  ) => {
    if (confidence) {
      const conf = confidenceStyles[confidence];
      return (
        <span
          ref={ref}
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-tight transition-colors select-none",
            conf.badge,
            className
          )}
          {...props}
        >
          <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", conf.dot)} />
          {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
          <span>{children ?? conf.label}</span>
        </span>
      );
    }

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-tight transition-colors select-none",
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {showDot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />}
        {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
        {children && <span>{children}</span>}
      </span>
    );
  }
);

Badge.displayName = "Badge";

export default Badge;
