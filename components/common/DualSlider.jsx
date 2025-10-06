"use client";

export default function DualSlider({ marks, value, onChange }) {
  const [lo, hi] = value;
  const max = marks.length - 1;
  const setLo = (i) => onChange([Math.min(i, hi), hi]);
  const setHi = (i) => onChange([lo, Math.max(i, lo)]);
  const loOnTop = lo >= hi - 1;

  return (
    <div className="dual-slider">
      <input type="range" min={0} max={max} step="1" value={lo}
        onChange={(e) => setLo(parseInt(e.target.value))}
        className="range" style={{ zIndex: loOnTop ? 6 : 4 }} aria-label="Minimum" />
      <input type="range" min={0} max={max} step="1" value={hi}
        onChange={(e) => setHi(parseInt(e.target.value))}
        className="range" style={{ zIndex: loOnTop ? 4 : 6 }} aria-label="Maximum" />
      <div className="rail" />
      <div className="marks">
        {marks.map((m, idx) => (
          <div key={idx} className="mark">
            <div className={`tick ${idx >= lo && idx <= hi ? "tick-active" : ""}`} />
            <span className="label">{m.label}</span>
          </div>
        ))}
      </div>
      <style jsx>{`
        .dual-slider { position: relative; padding-top: 26px; }
        .range {
          position: absolute; top: 0; left: 0; width: 100%;
          background: transparent; appearance: none; height: 0;
          pointer-events: none;
        }
        .range::-webkit-slider-thumb {
          pointer-events: auto; appearance: none;
          height: 18px; width: 18px; border-radius: 9999px;
          background: #4f46e5; border: 2px solid #fff;
          box-shadow: 0 0 0 2px #4f46e5; cursor: pointer;
        }
        .range::-moz-range-thumb {
          pointer-events: auto; height: 18px; width: 18px; border-radius: 9999px;
          background: #4f46e5; border: none; cursor: pointer;
        }
        .range::-webkit-slider-runnable-track { height: 8px; background: transparent; }
        .range::-moz-range-track { height: 8px; background: transparent; }
        .rail { position: relative; height: 8px; background: #e5e7eb; border-radius: 4px; margin-top: 8px; }
        .marks { display: flex; justify-content: space-between; font-size: 11px; color: #4b5563; margin-top: 8px; }
        .mark { display: flex; flex-direction: column; align-items: center; width: 12%; }
        .tick { width: 2px; height: 8px; background: #d1d5db; }
        .tick-active { background: #4f46e5; }
        .label { margin-top: 4px; white-space: nowrap; }
      `}</style>
    </div>
  );
}
