"use client";

import DualSlider from "./common/DualSlider";
import { Bell, Filter, DollarSign } from "lucide-react";

export default function FiltersPanel({
  loadingStocks,
  filteredCount,
  mcMarks, priceMarks,
  mcIdxRange, setMcIdxRange,
  priceIdxRange, setPriceIdxRange,
  conditions, condition, setCondition,
  days, setDays,
  maxAuto, setMaxAuto,
  maxStocks, setMaxStocks,
}) {
  const renderRange = (marks, [i0, i1]) => `${marks[i0].label} – ${marks[i1].label}`;

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <Bell className="w-8 h-8 text-indigo-600" />
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Trading Bot Pro</h1>
      </div>

      {loadingStocks ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-gray-600">Loading stocks...</span>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Market Cap */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Market Cap Range <span className="text-gray-500">({renderRange(mcMarks, mcIdxRange)})</span>
            </label>
            <DualSlider marks={mcMarks} value={mcIdxRange} onChange={setMcIdxRange} />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <DollarSign className="w-4 h-4 inline mr-1" />
              Price Range <span className="text-gray-500">({renderRange(priceMarks, priceIdxRange)})</span>
            </label>
            <DualSlider marks={priceMarks} value={priceIdxRange} onChange={setPriceIdxRange} />
          </div>

          <p className="text-xs text-gray-500">{filteredCount} stocks match</p>

          {/* Condition */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Condition</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none bg-white text-gray-900"
            >
              {Object.entries(conditions).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>

          {/* Days + Max Scan */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Days</label>
              <input
                type="number" min="1" max="365" value={days}
                onChange={(e) => setDays(parseInt(e.target.value) || 7)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none bg-white text-gray-900"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Max Scan</label>
                <label className="text-xs text-gray-600 flex items-center gap-1">
                  <input type="checkbox" checked={maxAuto} onChange={(e) => setMaxAuto(e.target.checked)} />
                  Auto
                </label>
              </div>
              <input
                type="number" min="1" value={maxStocks} disabled={maxAuto}
                onChange={(e) => { const v = parseInt(e.target.value) || 1; setMaxStocks(v); }}
                className={`w-full p-3 border-2 rounded-lg focus:border-indigo-500 focus:outline-none bg-white text-gray-900 ${maxAuto ? "border-gray-200 text-gray-400" : "border-gray-300"}`}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
