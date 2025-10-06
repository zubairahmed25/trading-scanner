"use client";

import { BarChart3 } from "lucide-react";
import TradingViewChart from "./TradingViewChart";
import NewsPanel from "./NewsPanel";
import InsiderPanel from "./InsiderPanel";

const formatVolume = (v) => (v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : `${(v/1e3).toFixed(1)}K`);

export default function RightPane({ selectedStock, chartInterval, setChartInterval }) {
  const chartIntervals = [
    { value: "1", label: "1m" },
    { value: "5", label: "5m" },
    { value: "15", label: "15m" },
    { value: "60", label: "1H" },
    { value: "240", label: "4H" },
    { value: "D", label: "1D" },
    { value: "W", label: "1W" },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-indigo-600" />
          <h2 className="text-xl font-bold text-gray-800">{selectedStock ? selectedStock.symbol : "Select a Stock"}</h2>
        </div>
        {selectedStock && (
          <a
            href={`tradingview://chart?symbol=${selectedStock.exchange}:${selectedStock.symbol}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              setTimeout(() => {
                window.open(
                  `https://www.tradingview.com/chart/?symbol=${selectedStock.exchange}:${selectedStock.symbol}`,
                  "_blank"
                );
              }, 500);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Open in App
          </a>
        )}
      </div>

      {selectedStock ? (
        <>
          <div className="mb-4 p-3 bg-gradient-to-r from-gray-50 to-indigo-50 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div><p className="text-xs text-gray-600">Price</p><p className="text-lg font-bold text-gray-900">${selectedStock.currentPrice}</p></div>
              <div><p className="text-xs text-gray-600">Change</p><p className={`text-lg font-bold ${selectedStock.direction === 'up' ? 'text-green-600' : 'text-red-600'}`}>{selectedStock.percentChange}%</p></div>
              <div><p className="text-xs text-gray-600">Volume</p><p className="text-lg font-bold text-gray-900">{formatVolume(selectedStock.volume)}</p></div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {chartIntervals.map((interval) => (
              <button key={interval.value} onClick={() => setChartInterval(interval.value)}
                className={`px-3 py-1.5 text-sm rounded-lg font-semibold transition-colors ${chartInterval === interval.value ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`}>
                {interval.label}
              </button>
            ))}
          </div>

          <TradingViewChart symbol={selectedStock.symbol} exchange={selectedStock.exchange} interval={chartInterval} />

          <NewsPanel symbol={selectedStock.symbol} />

          <InsiderPanel symbol={selectedStock.symbol} />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-96 text-gray-400">
          <BarChart3 className="w-24 h-24 mb-4" />
          <p className="text-lg">Click on a stock to view TradingView chart</p>
          <p className="text-sm mt-2">Professional-grade technical analysis</p>
        </div>
      )}
    </div>
  );
}
