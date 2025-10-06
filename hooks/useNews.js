"use client";

import { useEffect, useRef, useState } from "react";

export default function useNews(symbol) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const rid = useRef(0);

  useEffect(() => {
    if (!symbol) { setItems([]); setErr(""); return; }
    const my = ++rid.current;
    setLoading(true); setErr("");
    (async () => {
      try {
        const res = await fetch(`/api/fmp?resource=news&symbols=${encodeURIComponent(symbol)}`);
        if (!res.ok) throw new Error("news fetch failed");
        const raw = await res.json();
        if (my !== rid.current) return;
        const arr = Array.isArray(raw) ? raw : (Array.isArray(raw?.items) ? raw.items : []);
        const mapped = arr.map(n => ({
          title: n.title || n.headline || "Untitled",
          url: n.url || n.link,
          site: n.site || n.source || "",
          publishedAt: n.publishedDate || n.date || n.published_at || "",
          image: n.image || n.thumbnail || "",
          text: n.text || n.summary || ""
        }));
        setItems(mapped.slice(0, 10));
        setLoading(false);
      } catch {
        if (my !== rid.current) return;
        setErr("Failed to load news."); setLoading(false);
      }
    })();
  }, [symbol]);

  return { items, loading, err };
}
