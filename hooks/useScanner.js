"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const CONCURRENCY = 6;

export default function useScanner({ getStocksToScan, evaluateMatch }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState({ done: 0, total: 0, startedAt: 0 });

  // pause/resume/stop
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const pause = () => { setPaused(true); pausedRef.current = true; };
  const resume = () => { setPaused(false); pausedRef.current = false; };
  const stop = () => {
    activeScanIdRef.current += 1;
    if (hardAbortRef.current) { try { hardAbortRef.current.abort(); } catch {} }
    resume(); setLoading(false);
  };

  // auto-scan
  const [autoScan, setAutoScan] = useState(true);
  const [scanEverySec, setScanEverySec] = useState(60);

  // internals
  const bufferRef = useRef([]);
  const scannedRef = useRef(0);
  const foundAnyRef = useRef(false);
  const hardAbortRef = useRef(null);
  const activeScanIdRef = useRef(0);
  const resultsRef = useRef(results);
  useEffect(() => { resultsRef.current = results; }, [results]);

  // flush buffer regularly
  useEffect(() => {
    const id = setInterval(() => {
      if (bufferRef.current.length) {
        const batch = bufferRef.current; bufferRef.current = [];
        setResults(prev => upsertMany(prev, batch));
        setProgress(p => ({ ...p, done: scannedRef.current }));
      }
    }, 180);
    return () => clearInterval(id);
  }, []);

  const upsertMany = (prev, items) => {
    if (!items.length) return prev;
    const map = new Map(prev.map(r => [r.symbol, r]));
    for (const it of items) map.set(it.symbol, it);
    return Array.from(map.values());
  };

  const safeFetch = async (url, init) => {
    try {
      const r = await fetch(url, init);
      if (!r?.ok) return null;
      return r;
    } catch (e) {
      if (e?.name !== "AbortError") console.error(e);
      return null;
    }
  };
  const safeJson = async (res) => {
    try { return await res.json(); }
    catch (e) { if (e?.name !== "AbortError") console.error(e); return null; }
  };
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  async function asyncPool(concurrency, items, iteratorFn, { pausedRef, scanIdRef } = {}) {
    const executing = new Set();
    const currentScanId = scanIdRef.current;

    const run = async (item) => {
      while (pausedRef?.current && scanIdRef.current === currentScanId) await sleep(150);
      if (scanIdRef.current !== currentScanId) return;
      try { await iteratorFn(item); } catch (e) { if (e?.name !== "AbortError") console.error(e); }
    };

    for (const item of items) {
      if (scanIdRef.current !== currentScanId) break;
      const p = run(item);
      executing.add(p);
      p.finally(() => executing.delete(p));
      if (executing.size >= concurrency) { try { await Promise.race(executing); } catch {} }
    }
    await Promise.allSettled(executing);
  }

  const scanNow = useCallback(async ({ incremental = true } = {}) => {
    const myScanId = ++activeScanIdRef.current;
    setLoading(true); setError("");
    if (!incremental) setResults([]);
    scannedRef.current = 0; bufferRef.current = [];
    foundAnyRef.current = resultsRef.current.length > 0;

    const stocks = getStocksToScan();
    setProgress({ done: 0, total: stocks.length, startedAt: Date.now() });
    if (!stocks.length) { if (!incremental) setError("No stocks match your filters."); setLoading(false); return; }

    const matchedThisCycle = new Set();
    const controller = new AbortController();
    hardAbortRef.current = controller;

    try {
      await asyncPool(CONCURRENCY, stocks, async (stock) => {
        if (activeScanIdRef.current !== myScanId) return;
        while (pausedRef.current && activeScanIdRef.current === myScanId) await sleep(150);
        if (activeScanIdRef.current !== myScanId) return;

        const res = await safeFetch(`/api/fmp?resource=history&symbol=${encodeURIComponent(stock.symbol)}`, { signal: controller.signal });
        if (!res) { scannedRef.current += 1; return; }
        const data = await safeJson(res);
        if (!data) { scannedRef.current += 1; return; }
        if (activeScanIdRef.current !== myScanId) { scannedRef.current += 1; return; }

        const row = evaluateMatch(stock, data);
        if (row && activeScanIdRef.current === myScanId) {
          matchedThisCycle.add(stock.symbol);
          bufferRef.current.push(row);
        }
        scannedRef.current += 1;
      }, { pausedRef, scanIdRef: activeScanIdRef });

      if (bufferRef.current.length && activeScanIdRef.current === myScanId) {
        const batch = bufferRef.current; bufferRef.current = [];
        setResults(prev => upsertMany(prev, batch));
      }
      if (incremental && activeScanIdRef.current === myScanId) {
        setResults(prev => prev.filter(r => matchedThisCycle.has(r.symbol)));
      } else if (!foundAnyRef.current && activeScanIdRef.current === myScanId) {
        setError(`Scanned ${stocks.length} stocks. No matches.`);
      }
    } finally {
      if (activeScanIdRef.current === myScanId) {
        setLoading(false);
        setProgress(p => ({ ...p, done: scannedRef.current }));
      }
    }
  }, [getStocksToScan, evaluateMatch]);

  // auto loop
  const loopIdRef = useRef(0);
  useEffect(() => {
    loopIdRef.current += 1;
    const myId = loopIdRef.current;
    (async () => {
      if (!autoScan) return;
      await scanNow({ incremental: true });
      while (autoScan && myId === loopIdRef.current) {
        const target = Date.now() + Math.max(5, scanEverySec) * 1000;
        while (Date.now() < target && autoScan && myId === loopIdRef.current) await sleep(250);
        if (!autoScan || myId !== loopIdRef.current) break;
        await scanNow({ incremental: true });
      }
    })();
    return () => { activeScanIdRef.current += 1; };
  }, [autoScan, scanEverySec, scanNow]);

  return {
    results, setResults,
    loading, error, progress,
    paused, pause, resume, stop,
    autoScan, setAutoScan,
    scanEverySec, setScanEverySec,
    scanNow
  };
}
