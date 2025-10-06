"use client";

import { useEffect, useRef, useState } from "react";

export default function useInsider(symbol) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const rid = useRef(0);

  useEffect(() => {
    if (!symbol) { setRows([]); setErr(""); return; }
    const my = ++rid.current;
    setLoading(true); setErr("");
    (async () => {
      try {
        const res = await fetch(`/api/fmp?resource=insider&symbol=${encodeURIComponent(symbol)}&limit=20`);
        if (!res.ok) throw new Error("insider fetch failed");
        const raw = await res.json();
        if (my !== rid.current) return;
        const arr = Array.isArray(raw) ? raw : (Array.isArray(raw?.items) ? raw.items : []);
        const mapped = arr.map(x => {
          const shares = Number(x.securitiesTransacted ?? x.shares ?? x.sharesTransacted ?? 0);
          const price = Number(x.price ?? x.transactionPrice ?? 0);
          const value = shares && price ? shares * price : null;
          const typeRaw = (x.acquisitionOrDisposition ?? x.transactionType ?? x.type ?? "").toString().toUpperCase();
          const action = ["A","BUY","P"].includes(typeRaw) ? "Buy" :
                         (["D","SELL","S"].includes(typeRaw) ? "Sell" : (typeRaw || "—"));
          return {
            date: x.transactionDate || x.filingDate || x.date || "",
            name: x.name || x.reportingName || x.officerName || x.reporterName || "—",
            relation: x.relation || x.role || x.position || x.typeOfOwner || "",
            action, shares: shares || null, price: price || null, value,
            link: x.link || x.form4Link || x.secLink || null
          };
        });
        setRows(mapped.slice(0, 12));
        setLoading(false);
      } catch {
        if (my !== rid.current) return;
        setErr("Failed to load insider activity."); setLoading(false);
      }
    })();
  }, [symbol]);

  return { rows, loading, err };
}
