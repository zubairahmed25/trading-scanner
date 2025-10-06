"use client";

import useNews from "../../hooks/useNews";

const formatAgo = (iso) => {
  if (!iso) return "";
  const t = new Date(iso); if (isNaN(t.getTime())) return "";
  const s = Math.max(1, Math.floor((Date.now() - t.getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s/60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m/60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h/24); return `${d}d ago`;
};

export default function NewsPanel({ symbol }) {
  const { items, loading, err } = useNews(symbol);

  return (
    <div className="mt-6">
      <h3 className="text-lg font-bold text-gray-800 mb-3">Latest News</h3>

      {loading && (
        <div className="flex items-center gap-2 text-gray-600">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          Loading news…
        </div>
      )}
      {!loading && err && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{err}</div>
      )}
      {!loading && !err && items.length === 0 && (
        <div className="text-sm text-gray-500">No recent articles.</div>
      )}

      <div className="space-y-3 max-h-80 overflow-y-auto">
        {items.map((n, i) => (
          <a key={`${n.url || i}`} href={n.url || '#'} target="_blank" rel="noopener noreferrer" className="block border border-gray-200 rounded-lg p-3 hover:border-indigo-300 transition-colors">
            <div className="flex gap-3">
              {n.image ? <img src={n.image} alt="" className="w-20 h-20 object-cover rounded-md flex-shrink-0" /> : null}
              <div className="min-w-0">
                <div className="font-semibold text-gray-900 line-clamp-2">{n.title}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {n.site ? `${n.site} • ` : ""}{formatAgo(n.publishedAt)}
                </div>
                {n.text ? <p className="text-sm text-gray-700 mt-1 line-clamp-2">{n.text}</p> : null}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
