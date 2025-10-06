"use client";

import { ExternalLink } from "lucide-react";
import useInsider from "../../hooks/useInsider";

const nf = new Intl.NumberFormat("en-US");
const cf0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const cf2 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

export default function InsiderPanel({ symbol }) {
  const { rows, loading, err } = useInsider(symbol);

  return (
    <div className="mt-8">
      <h3 className="text-lg font-bold text-gray-800 mb-3">Insider Trading Activity</h3>

      {loading && (
        <div className="flex items-center gap-2 text-gray-600">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          Loading insider activity…
        </div>
      )}
      {!loading && err && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{err}</div>
      )}
      {!loading && !err && rows.length === 0 && (
        <div className="text-sm text-gray-500">No recent insider transactions.</div>
      )}

      <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr className="text-left text-gray-600">
              <th className="px-3 py-2 font-semibold">Date</th>
              <th className="px-3 py-2 font-semibold">Insider</th>
              <th className="px-3 py-2 font-semibold">Role</th>
              <th className="px-3 py-2 font-semibold">Action</th>
              <th className="px-3 py-2 font-semibold">Shares</th>
              <th className="px-3 py-2 font-semibold">Price</th>
              <th className="px-3 py-2 font-semibold">Value</th>
              <th className="px-3 py-2 font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((it, idx) => (
              <tr key={idx} className="border-t border-gray-100">
                <td className="px-3 py-2 text-gray-700">{it.date ? new Date(it.date).toLocaleDateString() : "—"}</td>
                <td className="px-3 py-2 text-gray-800 font-medium">{it.name}</td>
                <td className="px-3 py-2 text-gray-600">{it.relation || "—"}</td>
                <td className={`px-3 py-2 font-semibold ${it.action === "Buy" ? "text-green-600" : it.action === "Sell" ? "text-red-600" : "text-gray-700"}`}>
                  {it.action}
                </td>
                <td className="px-3 py-2 text-gray-700">{it.shares ? nf.format(it.shares) : "—"}</td>
                <td className="px-3 py-2 text-gray-700">{it.price ? cf2.format(it.price) : "—"}</td>
                <td className="px-3 py-2 text-gray-800">{it.value ? cf0.format(it.value) : "—"}</td>
                <td className="px-3 py-2">
                  {it.link ? (
                    <a href={it.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-indigo-600 hover:underline">
                      Filing <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
