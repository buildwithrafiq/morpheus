import { Zap, Key, X } from 'lucide-react';
import { useState } from 'react';
import { useServices } from '@/contexts/ServiceContext';

export function MockModeBanner() {
  const { buildMode } = useServices();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || buildMode === "real") return null;

  const isByok = buildMode === "byok";
  const isMock = buildMode === "mock";

  const borderColor = isByok ? "border-amber-400" : "border-purple-400";
  const bgColor = isByok ? "bg-amber-50" : "bg-purple-50";
  const iconBg = isByok ? "bg-amber-100" : "bg-purple-100";
  const iconColor = isByok ? "text-amber-600" : "text-purple-600";
  const titleColor = isByok ? "text-amber-900" : "text-purple-900";
  const textColor = isByok ? "text-amber-800" : "text-purple-800";
  const badgeBg = isByok ? "bg-amber-100" : "bg-purple-100";
  const badgeDot = isByok ? "bg-amber-500" : "bg-purple-500";
  const badgeText = isByok ? "text-amber-700" : "text-purple-700";
  const dismissColor = isByok ? "text-amber-400 hover:text-amber-600" : "text-purple-400 hover:text-purple-600";
  const hintColor = isByok ? "text-amber-600" : "text-purple-600";

  return (
    <div className={`fixed bottom-4 right-4 z-50 max-w-md rounded-lg border-2 ${borderColor} ${bgColor} p-4 shadow-2xl animate-slide-in`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
          {isByok
            ? <Key className={`h-4 w-4 ${iconColor}`} />
            : <Zap className={`h-4 w-4 ${iconColor}`} />}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <h3 className={`font-semibold ${titleColor}`}>
              {isByok ? "🔑 BYOK Mode" : "⚡ Instant Build Mode"}
            </h3>
            <button
              onClick={() => setDismissed(true)}
              className={dismissColor}
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className={`mt-1 text-sm ${textColor}`}>
            {isByok
              ? "Using your paid Gemini API key — no rate limits."
              : "Builds complete in seconds using pre-generated responses. No API calls, no rate limits, no costs!"}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <div className={`flex items-center gap-1 rounded-full ${badgeBg} px-2 py-1`}>
              <div className={`h-2 w-2 animate-pulse rounded-full ${badgeDot}`} />
              <span className={`text-xs font-medium ${badgeText}`}>
                {isByok ? "BYOK Active" : "Mock Mode Active"}
              </span>
            </div>
          </div>
          <p className={`mt-2 text-xs ${hintColor}`}>
            {isMock && "💡 Add your Gemini key in Settings → Build Mode to use the real API"}
            {isByok && "💡 Manage your key in Settings → Build Mode"}
          </p>
        </div>
      </div>
    </div>
  );
}
