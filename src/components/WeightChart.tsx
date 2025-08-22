// src/components/WeightChart.tsx
import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Dot
} from 'recharts';
import { format, parseISO } from 'date-fns';

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

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg shadow mt-6">
      <h3 className="text-lg font-bold text-pink-400 mb-4">📉 Weekly Weight Progress</h3>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={filledData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(date) => format(parseISO(date), 'MM-dd')}
            tick={{ fill: '#ccc', fontSize: 12 }}
          />
          <YAxis
            domain={[98, 103]}
            tick={{ fill: '#ccc', fontSize: 12 }}
            allowDecimals={true}
            ticks={Array.from({ length: Math.round((103 - 98) / 0.2) + 1 }, (_, i) => (98 + i * 0.2).toFixed(1)).map(Number)}
            tickFormatter={(v) => `${v.toFixed(1)} kg`}
          />
          <Tooltip
            formatter={(value: any) => `${value} kg`}
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
