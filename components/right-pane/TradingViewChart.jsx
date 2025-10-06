"use client";

import { useEffect, useRef } from "react";

export default function TradingViewChart({ symbol, exchange, interval }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";
    const fullSymbol = exchange ? `${exchange}:${symbol}` : symbol;

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      width: "100%",
      height: "100%",
      symbol: fullSymbol,
      interval,
      timezone: "Etc/UTC",
      theme: "light",
      style: "1",
      locale: "en",
      backgroundColor: "#ffffff",
      allow_symbol_change: true,
      calendar: false,
      hide_side_toolbar: false,
      hide_top_toolbar: false,
      hide_legend: false,
      hide_volume: false,
      support_host: "https://www.tradingview.com",
    });

    ref.current.appendChild(script);
  }, [symbol, exchange, interval]);

  return <div ref={ref} className="w-full h-full rounded-lg border border-gray-200 bg-white min-h-[450px]" />;
}
