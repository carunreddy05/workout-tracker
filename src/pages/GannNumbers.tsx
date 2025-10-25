import React, { useState } from "react";
import BackHeader from "../components/BackHeader";
import { Input } from "../components/ui/input";

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n);
}

export default function GannNumbers() {
  const [stockPrice, setStockPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<null | {
    price: number;
    sqrt: number;
    baseRoot: number;
    baseLevel?: number;
    above: { root: number; level: number; dist: number }[];
    below: { root: number; level: number; dist: number }[];
    nearestResistance?: number;
    nearestSupport?: number;
    summary: string[];
  }>(null);

  const handleGetGann = () => {
    setError(null);
    setOutput(null);

    const v = parseFloat(stockPrice.replace(/,/g, ''));
    if (Number.isNaN(v) || !isFinite(v) || v <= 0) {
      setError("Enter a valid positive number for Current stock Price.");
      return;
    }

    const sqrtVal = Math.sqrt(v);
    // choose nearest integer root as base
    const base = Math.round(sqrtVal);

    const above: { root: number; level: number; dist: number }[] = [];
    const below: { root: number; level: number; dist: number }[] = [];
    for (let i = 1; i <= 5; i++) {
      const r = base + i;
      const raw = Math.pow(r, 2);
      const level = raw % 2 === 0 ? raw + 1 : raw; // if even, add +1
      above.push({ root: r, level, dist: +(level - v) });
    }
    for (let i = 1; i <= 5; i++) {
      const r = base - i;
      const raw = Math.pow(r, 2);
      const level = raw % 2 === 0 ? raw + 1 : raw; // if even, add +1
      below.push({ root: r, level, dist: +(level - v) });
    }

    // nearest resistance = smallest positive distance, support = largest negative (closest below)
    const nearestResistance = above.reduce((acc, cur) => (acc === undefined || cur.dist < acc ? cur.dist : acc), undefined as number | undefined);
    const nearestResLevel = above.find(a => a.dist === nearestResistance)?.level;
    const nearestSupport = below.reduce((acc, cur) => (acc === undefined || Math.abs(cur.dist) < Math.abs(acc) ? cur.dist : acc), undefined as number | undefined);
    const nearestSupLevel = below.find(a => a.dist === nearestSupport)?.level;

    const summary: string[] = [];
    if (nearestResLevel) summary.push(`Nearest resistance: ${fmt(nearestResLevel)} ( +${fmt(nearestResistance || 0)} )`);
    if (nearestSupLevel) summary.push(`Nearest support: ${fmt(nearestSupLevel)} ( ${fmt(nearestSupport || 0)} )`);

  const rawBase = Math.pow(base, 2);
  const baseLevel = rawBase % 2 === 0 ? rawBase + 1 : rawBase; // if even, add +1

    setOutput({
      price: v,
      sqrt: +(sqrtVal.toFixed(6)),
      baseRoot: base,
      baseLevel,
      above,
      below,
      nearestResistance: nearestResLevel,
      nearestSupport: nearestSupLevel,
      summary,
    });
  };

  return (
    <div className="space-y-6">
      <BackHeader title="GANN THEORY NUMBERS" />
      <div className="p-6 bg-zinc-800 border border-zinc-700 rounded">
        <p className="text-sm text-zinc-300 mb-4">
          Gann method (quick): take the square root of the price, move ±1, ±2, ... from that root,
          then square those integers to get natural price levels (possible support/resistance).
          <br />Note: per your rule, if a squared level is an even integer we increment it by +1.
        </p>

        <label className="block text-zinc-300 mb-2 font-medium">Current stock Price</label>
        <Input
          value={stockPrice}
          onChange={(e) => setStockPrice(e.target.value)}
          placeholder="e.g. 4398"
          className="bg-zinc-700 border-zinc-600 text-white mb-3"
        />
        {error && <div className="text-sm text-red-400 mb-2">{error}</div>}
        <div className="flex gap-3">
          <button
            onClick={handleGetGann}
            className="px-4 py-2 rounded bg-pink-500 text-white hover:opacity-90"
          >
            Get me GANN Numbers
          </button>
        </div>

        {output && (
          <div className="mt-4 text-zinc-200">
            <div className="mb-2">
              <strong>Input price:</strong> {fmt(output.price)}
            </div>
            <div className="mb-2">
              <strong>Square root:</strong> {output.sqrt} (base integer root: {output.baseRoot})
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left text-zinc-300 pb-2">Direction</th>
                    <th className="text-left text-zinc-300 pb-2">Root</th>
                    <th className="text-left text-zinc-300 pb-2">Gann Level</th>
                    <th className="text-left text-zinc-300 pb-2">Distance</th>
                    <th className="text-left text-zinc-300 pb-2">Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {[...output.above].slice().reverse().map((a, i) => (
                    <tr
                      key={`a-${a.root}-${i}`}
                      className="hover:bg-zinc-800/60"
                      aria-label={`Above level ${a.root}`}
                    >
                      <td className="py-1 text-emerald-400 font-medium">Above</td>
                      <td className="py-1">{a.root}</td>
                      <td className="py-1">
                        <span className="inline-block px-3 py-1 rounded-md bg-emerald-800/30 text-emerald-200">{fmt(a.level)}</span>
                      </td>
                      <td className="py-1 text-emerald-300">+{fmt(a.dist)}</td>
                      <td className="py-1 text-emerald-200">Resistance</td>
                    </tr>
                  ))}
                  {/* base level (current integer root) */}
                  <tr
                    aria-current="true"
                    className="bg-yellow-600/10 ring-2 ring-yellow-400/40 rounded-md my-1"
                  >
                    <td className="py-2 text-yellow-300 font-bold">Base</td>
                    <td className="py-2 font-semibold text-yellow-100">{output.baseRoot}</td>
                    <td className="py-2 font-semibold text-yellow-100">{fmt(output.baseLevel ?? Math.pow(output.baseRoot, 2))}</td>
                    <td className="py-2 font-semibold text-yellow-200">{fmt((output.baseLevel ?? Math.pow(output.baseRoot, 2)) - output.price)}</td>
                    <td className="py-2 text-zinc-300">Current / Base level</td>
                  </tr>
                  {output.below.map((b, i) => (
                    <tr
                      key={`b-${i}`}
                      className="hover:bg-zinc-800/60"
                      aria-label={`Below level ${b.root}`}
                    >
                      <td className="py-1 text-rose-400 font-medium">Below</td>
                      <td className="py-1">{b.root}</td>
                      <td className="py-1">
                        <span className="inline-block px-3 py-1 rounded-md bg-rose-800/30 text-rose-200">{fmt(b.level)}</span>
                      </td>
                      <td className="py-1 text-rose-300">{fmt(b.dist)}</td>
                      <td className="py-1 text-rose-200">Support</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 text-zinc-200">
              {output.summary.map((s, i) => (
                <div key={i}>{s}</div>
              ))}
            </div>

            <div className="mt-4 text-sm text-zinc-300">
              <div>
                If price breaks above the nearest resistance level the bias turns bullish toward the next
                Gann levels.
              </div>
              <div>
                If price breaks below the nearest support level the bias turns bearish toward lower Gann
                supports.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
