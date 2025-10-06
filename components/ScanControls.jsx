"use client";

import { Search } from "lucide-react";

export default function ScanControls({
  loading, progress,
  paused, pause, resume, stop, scanNow,
  autoScan, setAutoScan, scanEverySec, setScanEverySec,
  pending, applyChanges,
}) {
  return (
    <div className="mt-5 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={scanNow}
          disabled={loading}
          className="bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:text-gray-200 transition-colors flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Scan Now
            </>
          )}
        </button>

        <button
          onClick={paused ? resume : pause}
          className="py-2 px-4 rounded-lg font-semibold border border-gray-300 text-gray-700 hover:bg-gray-100"
        >
          {paused ? "Resume" : "Pause"}
        </button>

        <button
          onClick={stop}
          className="py-2 px-4 rounded-lg font-semibold border border-red-300 text-red-600 hover:bg-red-50"
        >
          Stop
        </button>

        <label className="flex items-center gap-2 ml-auto text-sm">
          <input type="checkbox" checked={autoScan} onChange={(e) => setAutoScan(e.target.checked)} />
          Auto Scan every
          <input
            type="number" min={5} value={scanEverySec}
            onChange={(e) => setScanEverySec(Math.max(5, parseInt(e.target.value) || 60))}
            className="w-20 p-1.5 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none text-gray-900"
          />
          sec
        </label>
      </div>

      {pending && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
          <span>Filters changed. Apply to restart scan with new settings.</span>
          <button onClick={applyChanges} className="py-1.5 px-3 rounded-md bg-amber-600 text-white font-semibold hover:bg-amber-700">
            Apply Changes
          </button>
        </div>
      )}

      {loading && (
        <div className="text-sm text-gray-600 w-full">
          Scanning {progress.done} / {progress.total}
          <div className="w-full bg-gray-200 rounded h-2 mt-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-2"
              style={{ width: progress.total ? `${Math.min(100, (progress.done / progress.total) * 100)}%` : "0%" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
