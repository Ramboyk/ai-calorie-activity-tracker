export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-surface transition-opacity duration-300">
      <div className="relative flex flex-col items-center">
        {/* NutriTrack AI Glowing Emerald Ring */}
        <div className="relative flex items-center justify-center w-24 h-24 rounded-3xl bg-primary-soft/80 border border-primary-light/40 shadow-xl shadow-primary/10">
          {/* Pulsing Aura */}
          <div className="absolute inset-0 rounded-3xl bg-primary/20 animate-ping opacity-25" />
          
          {/* Custom NutriTrack AI Logo Badge */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/icon-192.png"
            alt="NutriTrack AI Logo"
            className="w-14 h-14 object-contain animate-pulse"
          />
        </div>

        {/* Brand Name & Loading Indicator */}
        <div className="mt-5 flex flex-col items-center space-y-2 text-center">
          <h2 className="text-xl font-bold tracking-tight text-app-text-dark font-sans">
            NutriTrack <span className="text-primary">AI</span>
          </h2>
          <div className="flex items-center space-x-1.5 text-xs font-medium text-app-text-muted">
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
