// src/components/WeightChart.tsx
import React, { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Dot
} from 'recharts';
import { format, parseISO, isAfter, subDays, startOfYear } from 'date-fns';

interface WeightEntry {
  dateDay: string;
  weight?: number;
}

interface Props {
  entries: WeightEntry[];
}

export default function WeightChart({ entries }: Props) {
  // Step 1: Convert entries to daily weight, filling gaps
  const sorted = [...entries]
    .filter(e => e.weight !== undefined)
    .sort((a, b) => (a.dateDay > b.dateDay ? 1 : -1));

  console.log('WeightChart entries:', entries);
  console.log('First entry:', entries[0]);

  // Step back: ensure lastWeight is initialized to first valid entry in entries
  let lastWeight: number | undefined = undefined;
  if (Array.isArray(entries)) {
    for (const e of entries) {
      if (typeof e.weight === 'number' && !isNaN(e.weight) && e.weight > 0) {
        lastWeight = e.weight;
        break;
      }
    }
  }
  // Helper to extract just the date part from dateDay
  const getDate = (dateDay: string) => dateDay.split(' ')[0];
  const dateWeightMap: Record<string, number | undefined> = {};
  if (Array.isArray(entries)) {
    let lastWeight: number | undefined = undefined;
    for (const e of entries) {
      const entryWeight = typeof e.weight === 'number' && !isNaN(e.weight) && e.weight > 0 ? e.weight : undefined;
      if (entryWeight !== undefined) {
        lastWeight = entryWeight;
      }
      dateWeightMap[getDate(e.dateDay)] = lastWeight;
    }
  }
  console.log('dateWeightMap:', dateWeightMap);

  const allDates = Array.isArray(entries)
    ? Array.from(new Set(entries.map((e: any) => getDate(e.dateDay)))).sort()
    : [];

  const filledData = allDates.map(dateStr => ({
    date: dateStr,
    weight: dateWeightMap[dateStr],
  }));

  console.log('Filled data for chart:', filledData);

  const weights = filledData.map(d => d.weight).filter((w): w is number => w !== null);

  const minWeight = weights.length > 0 ? Math.floor(Math.min(...weights) * 10) / 10 : 95;
  const maxWeight = weights.length > 0 ? Math.ceil(Math.max(...weights) * 10) / 10 : 103;

  const firstWeight = filledData[0]?.weight;
  const chartLastWeight = filledData[filledData.length - 1]?.weight;
  const isLosingWeight =
    filledData.length > 1 &&
    typeof firstWeight === 'number' &&
    typeof chartLastWeight === 'number' &&
    firstWeight > chartLastWeight;

  const color = isLosingWeight ? '#ef4444' : '#22c55e'; // red if losing, green otherwise

  const [filter, setFilter] = useState<"7d" | "30d" | "ytd" | "all">("all");
  const [units, setUnits] = useState<'kg' | 'lb'>('kg');
  const KG_TO_LB = 2.2046226218;

  // Filter logic
  const today = new Date();
  let filteredData = filledData;
  if (filter === "7d") {
    filteredData = filledData.filter(d => isAfter(parseISO(d.date), subDays(today, 7)));
  } else if (filter === "30d") {
    filteredData = filledData.filter(d => isAfter(parseISO(d.date), subDays(today, 30)));
  } else if (filter === "ytd") {
    filteredData = filledData.filter(d => isAfter(parseISO(d.date), startOfYear(today)));
  }

  // displayData converts weights to selected units for rendering (does not mutate original)
  const displayData = filteredData.map(d => ({
    ...d,
    weight: typeof d.weight === 'number' ? (units === 'kg' ? d.weight : +(d.weight * KG_TO_LB)) : d.weight,
  }));

  const displayWeights = displayData.map(d => d.weight).filter((w): w is number => typeof w === 'number');
  const displayMin = displayWeights.length > 0 ? Math.floor(Math.min(...displayWeights) * 10) / 10 : (units === 'kg' ? 95 : +(95 * KG_TO_LB));
  const displayMax = displayWeights.length > 0 ? Math.ceil(Math.max(...displayWeights) * 10) / 10 : (units === 'kg' ? 103 : +(103 * KG_TO_LB));
  const step = units === 'kg' ? 0.2 : 0.5;
  const ticks = Array.from({ length: Math.round((displayMax - displayMin) / step) + 1 }, (_, i) => +(displayMin + i * step).toFixed(1));

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg shadow mt-6">
      <h3 className="text-lg font-bold text-pink-400 mb-4">📉 Weekly Weight Progress</h3>
      <div className="mb-2 flex gap-2">
        <button onClick={() => setFilter("7d")} className={`px-2 py-1 rounded ${filter === "7d" ? "bg-pink-400 text-white" : "bg-zinc-800 text-zinc-300"}`}>Last 7 Days</button>
        <button onClick={() => setFilter("30d")} className={`px-2 py-1 rounded ${filter === "30d" ? "bg-pink-400 text-white" : "bg-zinc-800 text-zinc-300"}`}>Last 30 Days</button>
        <button onClick={() => setFilter("ytd")} className={`px-2 py-1 rounded ${filter === "ytd" ? "bg-pink-400 text-white" : "bg-zinc-800 text-zinc-300"}`}>YTD</button>
        <button onClick={() => setFilter("all")} className={`px-2 py-1 rounded ${filter === "all" ? "bg-pink-400 text-white" : "bg-zinc-800 text-zinc-300"}`}>All</button>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setUnits('kg')}
            className={`px-3 py-1 rounded ${units === 'kg' ? 'bg-pink-400 text-white' : 'bg-zinc-800 text-zinc-300'}`}
            aria-pressed={units === 'kg'}
          >
            kg
          </button>
          <button
            onClick={() => setUnits('lb')}
            className={`px-3 py-1 rounded ${units === 'lb' ? 'bg-pink-400 text-white' : 'bg-zinc-800 text-zinc-300'}`}
            aria-pressed={units === 'lb'}
          >
            lb
          </button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={displayData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(date) => format(parseISO(date), 'MM-dd')}
            tick={{ fill: '#ccc', fontSize: 12 }}
          />
          <YAxis
            domain={[displayMin, displayMax]}
            tick={{ fill: '#ccc', fontSize: 12 }}
            allowDecimals={true}
            ticks={ticks}
            tickFormatter={(v) => `${(v as number).toFixed(1)} ${units}`}
          />
          <Tooltip
            formatter={(value: any) => `${typeof value === 'number' ? value.toFixed(1) : value} ${units}`}
            labelFormatter={(label) => format(parseISO(label), 'eeee, MMM d')}
            contentStyle={{ backgroundColor: '#1f1f1f', borderColor: '#333' }}
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke={color}
            strokeWidth={3}
            dot={<Dot r={4} stroke="#fff" fill={color} />}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
