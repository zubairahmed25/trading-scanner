"use client";

import { useMemo, useState, useCallback } from "react";
import FiltersPanel from "../components/FiltersPanel";
import ScanControls from "../components/ScanControls";
import ResultsList from "../components/ResultsList";
import RightPane from "../components/right-pane/RightPane";
import useAllStocks from "../hooks/useAllStocks";
import useScanner from "../hooks/useScanner";

// Marks/constants for sliders & conditions
const MC_MARKS = [
  { label: "0", value: 0 },
  { label: "100M", value: 100_000_000 },
  { label: "500M", value: 500_000_000 },
  { label: "1B", value: 1_000_000_000 },
  { label: "10B", value: 10_000_000_000 },
  { label: "50B", value: 50_000_000_000 },
  { label: "100B", value: 100_000_000_000 },
  { label: "200B+", value: Infinity },
];

const PRICE_MARKS = [
  { label: "$0", value: 0 },
  { label: "$5", value: 5 },
  { label: "$10", value: 10 },
  { label: "$25", value: 25 },
  { label: "$50", value: 50 },
  { label: "$100", value: 100 },
  { label: "$250", value: 250 },
  { label: "$500", value: 500 },
  { label: "$1000+", value: Infinity },
];

const CONDITIONS = {
  down5:  { label: "More than 5% down",  threshold: -5,  direction: "down" },
  down10: { label: "More than 10% down", threshold: -10, direction: "down" },
  down15: { label: "More than 15% down", threshold: -15, direction: "down" },
  down20: { label: "More than 20% down", threshold: -20, direction: "down" },
  down30: { label: "More than 30% down", threshold: -30, direction: "down" },
  up5:    { label: "More than 5% up",    threshold: 5,   direction: "up" },
  up10:   { label: "More than 10% up",   threshold: 10,  direction: "up" },
  up20:   { label: "More than 20% up",   threshold: 20,  direction: "up" },
  up30:   { label: "More than 30% up",   threshold: 30,  direction: "up" },
};

export default function Page() {
  // Filters
  const [mcIdxRange, setMcIdxRange] = useState([0, MC_MARKS.length - 1]);
  const [priceIdxRange, setPriceIdxRange] = useState([0, PRICE_MARKS.length - 1]);
  const [condition, setCondition] = useState("down5");
  const [days, setDays] = useState(7);
  const [maxStocks, setMaxStocks] = useState(20);
  const [maxAuto, setMaxAuto] = useState(true);

  // Apply/changes banner
  const [pending, setPending] = useState(false);
  const markPending = () => setPending(true);

  // Chart / selection
  const [selectedStock, setSelectedStock] = useState(null);
  const [chartInterval, setChartInterval] = useState("D");

  // Universe
  const { allStocks, loadingStocks } = useAllStocks();

  const mcVal = (i) => MC_MARKS[i].value;
  const priceVal = (i) => PRICE_MARKS[i].value;

  const filteredStocks = useMemo(() => {
    const mcMin = mcVal(mcIdxRange[0]);
    const mcMax = mcVal(mcIdxRange[1]);
    const pMin = priceVal(priceIdxRange[0]);
    const pMax = priceVal(priceIdxRange[1]);
    return allStocks.filter((s) => {
      const mcOk = s.marketCap >= mcMin && (mcMax === Infinity || s.marketCap <= mcMax);
      const pOk = s.price >= pMin && (pMax === Infinity || s.price <= pMax);
      return mcOk && pOk;
    });
  }, [allStocks, mcIdxRange, priceIdxRange]);

  // Respect "Auto" for max scan
  const effectiveMax = maxAuto ? filteredStocks.length : maxStocks;

  // Provide the scanner with the current universe & matching rule
  const getStocksToScan = useCallback(
    () => filteredStocks.slice(0, effectiveMax),
    [filteredStocks, effectiveMax]
  );

  const evaluateMatch = useCallback(
    (stock, history) => {
      const cond = CONDITIONS[condition];
      if (!history?.historical || history.historical.length < days + 1) return null;
      const current = parseFloat(history.historical[0].close);
      const past = parseFloat(history.historical[days].close);
      const change = ((current - past) / past) * 100;
      const match =
        (cond.direction === "down" && change <= cond.threshold) ||
        (cond.direction === "up" && change >= cond.threshold);
      if (!match) return null;
      return {
        symbol: stock.symbol,
        name: stock.name,
        currentPrice: current.toFixed(2),
        pastPrice: past.toFixed(2),
        percentChange: change.toFixed(2),
        direction: change > 0 ? "up" : "down",
        marketCap: stock.marketCap,
        volume: history.historical[0].volume,
        exchange: stock.exchange,
      };
    },
    [condition, days]
  );

  // Scanner (progressive + auto-scan + pause/resume/stop)
  const {
    results, loading, error, progress,
    paused, pause, resume, stop,
    autoScan, setAutoScan, scanEverySec, setScanEverySec,
    scanNow, setResults
  } = useScanner({ getStocksToScan, evaluateMatch });

  // Ensure Max Auto keeps results if the selected stock remains present
  const onSelectStock = (s) => setSelectedStock(s);

  // Apply changes: full rescan
  const applyChanges = async () => {
    setPending(false);
    resume();
    // Clear current results then full scan
    setResults([]);
    await scanNow({ incremental: false });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <FiltersPanel
            loadingStocks={loadingStocks}
            filteredCount={filteredStocks.length}
            mcMarks={MC_MARKS}
            priceMarks={PRICE_MARKS}
            mcIdxRange={mcIdxRange}
            setMcIdxRange={(v) => { setMcIdxRange(v); markPending(); }}
            priceIdxRange={priceIdxRange}
            setPriceIdxRange={(v) => { setPriceIdxRange(v); markPending(); }}
            conditions={CONDITIONS}
            condition={condition}
            setCondition={(v) => { setCondition(v); markPending(); }}
            days={days}
            setDays={(v) => { setDays(v); markPending(); }}
            maxAuto={maxAuto}
            setMaxAuto={setMaxAuto}
            maxStocks={maxStocks}
            setMaxStocks={setMaxStocks}
          />

          <ScanControls
            loading={loading}
            progress={progress}
            paused={paused}
            pause={pause}
            resume={resume}
            stop={stop}
            scanNow={() => scanNow({ incremental: false })}
            autoScan={autoScan}
            setAutoScan={setAutoScan}
            scanEverySec={scanEverySec}
            setScanEverySec={setScanEverySec}
            pending={pending}
            applyChanges={applyChanges}
          />

          {(!loading && error && results.length === 0) ? (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          ) : null}

          <ResultsList
            results={results}
            selectedSymbol={selectedStock?.symbol}
            onSelect={onSelectStock}
          />
        </div>

        <RightPane
          selectedStock={selectedStock}
          chartInterval={chartInterval}
          setChartInterval={setChartInterval}
        />
      </div>

      <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-800">
          <strong>🚀 TradingView Advanced Charts!</strong> Professional charting with 50+ indicators, drawing tools, and real-time analysis. Optimized for 300 API calls/min.
        </p>
      </div>
    </div>
  );
}
