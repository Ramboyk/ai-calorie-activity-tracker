import React from "react";
import { cn } from "@/lib/utils/cn";
import { Info, Sparkles } from "lucide-react";

export interface DisclaimerBannerProps extends React.HTMLAttributes<HTMLDivElement> {
  compact?: boolean;
  showAiBadge?: boolean;
  className?: string;
  customText?: string;
}

export function DisclaimerBanner({
  compact = false,
  showAiBadge = true,
  className,
  customText,
  ...props
}: DisclaimerBannerProps) {
  const defaultText =
    "Kalori ve besin değerleri yapay zekâ tarafından görsel üzerinden tahmin edilir ve kesin ölçüm değildir. Tıbbi tavsiye niteliği taşımaz.";

  return (
    <aside
      role="note"
      aria-label="Yapay Zekâ ve Sağlık Feragatnamesi"
      className={cn(
        "rounded-2xl border border-surface-container bg-surface-container-low/70 p-3.5 sm:p-4 text-xs text-app-text-muted transition-colors",
        compact ? "py-2.5 px-3 text-[11px]" : "space-y-1.5",
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-2.5">
        <div className="p-1 rounded-lg bg-surface-container text-outline shrink-0 mt-0.5">
          <Info className="w-3.5 h-3.5 text-app-text-muted" aria-hidden="true" />
        </div>

        <div className="flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-app-text-main text-xs">
              Bilgilendirme Notu
            </span>
            {showAiBadge && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-surface-container-high text-[10px] font-medium text-app-text-muted">
                <Sparkles className="w-2.5 h-2.5 text-primary" aria-hidden="true" />
                AI Tahmin Modeli
              </span>
            )}
          </div>
          <p className="leading-relaxed text-app-text-muted">
            {customText || defaultText}
          </p>
        </div>
      </div>
    </aside>
  );
}

export default DisclaimerBanner;
