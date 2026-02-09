import { useState } from "react";
import { Zap, Cloud, Key, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { useServices } from "@/contexts/ServiceContext";

export default function MockModeToggle() {
  const { buildMode, switchBuildMode, setByokKey, byokKey } = useServices();
  const [keyInput, setKeyInput] = useState(byokKey ?? "");
  const [showKey, setShowKey] = useState(false);

  const handleByokSubmit = () => {
    if (keyInput.trim()) {
      setByokKey(keyInput.trim());
    }
  };

  const handleClearByok = () => {
    setKeyInput("");
    setByokKey("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Build Mode</h2>
        <p className="mt-1 text-sm text-gray-500">
          Choose how agent builds are powered. Bring your own Gemini key for unlimited access.
        </p>
      </div>

      {/* Mode selector cards */}
      <div className="grid gap-3">
        {/* Mock Mode */}
        <button
          type="button"
          onClick={() => switchBuildMode("mock")}
          className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
            buildMode === "mock"
              ? "border-purple-300 bg-purple-50"
              : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
            buildMode === "mock" ? "bg-purple-100" : "bg-gray-100"
          }`}>
            <Zap className={`h-5 w-5 ${buildMode === "mock" ? "text-purple-600" : "text-gray-400"}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className={`font-semibold ${buildMode === "mock" ? "text-purple-900" : "text-gray-700"}`}>
              Mock Mode
            </p>
            <p className={`text-sm ${buildMode === "mock" ? "text-purple-600" : "text-gray-500"}`}>
              Instant builds, no API calls — perfect for demos
            </p>
          </div>
          {buildMode === "mock" && <CheckCircle className="h-5 w-5 shrink-0 text-purple-500" />}
        </button>

        {/* Real API Mode */}
        <button
          type="button"
          onClick={() => switchBuildMode("real")}
          className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
            buildMode === "real"
              ? "border-green-300 bg-green-50"
              : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
            buildMode === "real" ? "bg-green-100" : "bg-gray-100"
          }`}>
            <Cloud className={`h-5 w-5 ${buildMode === "real" ? "text-green-600" : "text-gray-400"}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className={`font-semibold ${buildMode === "real" ? "text-green-900" : "text-gray-700"}`}>
              Real API (env key)
            </p>
            <p className={`text-sm ${buildMode === "real" ? "text-green-600" : "text-gray-500"}`}>
              Uses VITE_GEMINI_API_KEY from .env — free tier rate limits apply
            </p>
          </div>
          {buildMode === "real" && <CheckCircle className="h-5 w-5 shrink-0 text-green-500" />}
        </button>

        {/* BYOK Mode */}
        <div
          className={`rounded-xl border-2 p-4 transition-all ${
            buildMode === "byok"
              ? "border-amber-300 bg-amber-50"
              : "border-gray-200 bg-white"
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
              buildMode === "byok" ? "bg-amber-100" : "bg-gray-100"
            }`}>
              <Key className={`h-5 w-5 ${buildMode === "byok" ? "text-amber-600" : "text-gray-400"}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className={`font-semibold ${buildMode === "byok" ? "text-amber-900" : "text-gray-700"}`}>
                Bring Your Own Key (BYOK)
              </p>
              <p className={`text-sm ${buildMode === "byok" ? "text-amber-600" : "text-gray-500"}`}>
                Use your paid Gemini API key — no rate limits
              </p>
            </div>
            {buildMode === "byok" && <CheckCircle className="h-5 w-5 shrink-0 text-amber-500" />}
          </div>

          {/* BYOK key input */}
          <div className="mt-4 space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showKey ? "text" : "password"}
                  value={keyInput}
                  onChange={e => setKeyInput(e.target.value)}
                  placeholder="AIza..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm font-mono focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  onKeyDown={e => { if (e.key === "Enter") handleByokSubmit(); }}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(p => !p)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showKey ? "Hide key" : "Show key"}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <button
                type="button"
                onClick={handleByokSubmit}
                disabled={!(keyInput ?? "").trim()}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
              >
                Activate
              </button>
              {byokKey && (
                <button
                  type="button"
                  onClick={handleClearByok}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Get a key at{" "}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-600 underline hover:text-amber-700"
              >
                aistudio.google.com/apikey
              </a>
              . Your key stays in your browser — it's never sent to our servers.
            </p>
          </div>
        </div>
      </div>

      {/* Info panel */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="text-xs font-medium text-gray-700">Mode comparison:</p>
        <div className="mt-2 grid grid-cols-3 gap-3 text-xs text-gray-600">
          <div>
            <p className="font-medium text-purple-700">⚡ Mock</p>
            <ul className="mt-1 space-y-0.5">
              <li>• Instant builds</li>
              <li>• No API key needed</li>
              <li>• Pre-generated data</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-green-700">🚀 Real API</p>
            <ul className="mt-1 space-y-0.5">
              <li>• .env key</li>
              <li>• Free tier limits</li>
              <li>• 20-30s builds</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-amber-700">🔑 BYOK</p>
            <ul className="mt-1 space-y-0.5">
              <li>• Your paid key</li>
              <li>• No rate limits</li>
              <li>• Full quality</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
