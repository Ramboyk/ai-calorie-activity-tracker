"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { CheckCircle2, Info, AlertTriangle, X } from "lucide-react";

export type ToastType = "success" | "info" | "error";

export interface ToastItem {
  id: string;
  message: string;
  type?: ToastType;
}

export interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

const typeStyles: Record<ToastType, { border: string; bg: string; text: string; icon: React.ReactNode }> = {
  success: {
    border: "border-primary/25",
    bg: "bg-surface-container-lowest/95 dark:bg-surface-container-low/95",
    text: "text-primary",
    icon: <CheckCircle2 className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />,
  },
  info: {
    border: "border-water/25",
    bg: "bg-surface-container-lowest/95 dark:bg-surface-container-low/95",
    text: "text-water",
    icon: <Info className="w-4 h-4 text-water shrink-0" aria-hidden="true" />,
  },
  error: {
    border: "border-error/25",
    bg: "bg-surface-container-lowest/95 dark:bg-surface-container-low/95",
    text: "text-error",
    icon: <AlertTriangle className="w-4 h-4 text-error shrink-0" aria-hidden="true" />,
  },
};

export function Toast({ toast, onDismiss }: ToastProps) {
  const toastType = toast.type || "success";
  const config = typeStyles[toastType] || typeStyles.success;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center gap-2.5 px-4 py-3 rounded-2xl border shadow-lg backdrop-blur-md",
        "animate-in fade-in slide-in-from-top-2 duration-200 ease-out select-none",
        config.bg,
        config.border
      )}
    >
      {config.icon}
      <span className="text-xs font-bold text-app-text-main leading-tight pr-1">
        {toast.message}
      </span>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Bildirimi Kapat"
        className="w-7 h-7 min-w-[28px] min-h-[28px] rounded-full flex items-center justify-center text-app-text-muted hover:text-app-text-main hover:bg-surface-container transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <aside
      aria-label="Bildirimler"
      className="fixed top-20 right-4 sm:right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full sm:w-auto"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </aside>
  );
}

export default ToastContainer;
