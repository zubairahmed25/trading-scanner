"use client";

import { useEffect, useState } from "react";

export default function useAllStocks() {
  const [allStocks, setAllStocks] = useState([]);
  const [loadingStocks, setLoadingStocks] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/fmp?resource=screener&marketCapMoreThan=1000000&limit=5000`);
        const data = await res.json();
        if (!alive) return;
        if (Array.isArray(data)) {
          const stocks = data
            .filter(s =>
              (s.exchangeShortName === 'NASDAQ' || s.exchangeShortName === 'NYSE') &&
              s.marketCap > 0 && s.price > 0
            )
            .map(s => ({
              symbol: s.symbol,
              name: s.companyName,
              marketCap: s.marketCap,
              price: s.price,
              volume: s.volume || 0,
              exchange: s.exchangeShortName,
            }));
          setAllStocks(stocks);
        } else {
          setAllStocks([]);
        }
      } catch {
        // small offline sample
        if (!alive) return;
        setAllStocks([
          { symbol: 'AAPL', name: 'Apple Inc.', marketCap: 3000000000000, price: 175, volume: 50000000, exchange: 'NASDAQ' },
          { symbol: 'MSFT', name: 'Microsoft', marketCap: 2800000000000, price: 380, volume: 25000000, exchange: 'NASDAQ' },
        ]);
      } finally {
        if (alive) setLoadingStocks(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return { allStocks, loadingStocks };
}
