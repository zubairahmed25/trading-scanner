"use client";

import { TrendingUp, TrendingDown } from "lucide-react";

const formatMarketCap = (n) => (n >= 1e9 ? `$${(n/1e9).toFixed(1)}B` : `$${(n/1e6).toFixed(1)}M`);
const formatVolume = (v) => (v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : `${(v/1e3).toFixed(1)}K`);

export default function ResultsList({ results, selectedSymbol, onSelect }) {
  return (
    <div className="mt-6">
      <h2 className="text-lg font-bold text-gray-800 mb-3">Matching Stocks ({results.length})</h2>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {results.map((stock) => (
          <div
            key={stock.symbol}
            onClick={() => onSelect(stock)}
            className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
              selectedSymbol === stock.symbol ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-indigo-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {stock.direction === "up" ? (
                  <TrendingUp className="w-5 h-5 text-green-500" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-500" />
                )}
                <div>
                  <h3 className="font-bold text-gray-800">{stock.symbol}</h3>
                  <p className="text-xs text-gray-600">{stock.name}</p>
                  <p className="text-xs text-gray-500">
                    ${stock.currentPrice} • {formatMarketCap(stock.marketCap)} • Vol: {formatVolume(stock.volume)}
                  </p>
                </div>
              </div>
              <div className={`text-lg font-bold ${stock.direction === "up" ? "text-green-600" : "text-red-600"}`}>
                {stock.percentChange}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
