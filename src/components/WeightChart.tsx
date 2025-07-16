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

  const dateWeightMap: { [key: string]: number } = {};
  let lastWeight = 0;
  sorted.forEach(({ dateDay, weight }) => {
    const dateStr = dateDay.split(' - ')[0];
    if (weight !== undefined) lastWeight = weight;
    dateWeightMap[dateStr] = lastWeight;
  });

  const allDates = Array.from(
    new Set(entries.map(e => e.dateDay.split(' - ')[0]))
  ).sort();

  const filledData = allDates.map(dateStr => ({
    date: dateStr,
    weight: dateWeightMap[dateStr] ?? lastWeight,
  }));

  // Step 2: Determine line color by checking trend
  const isLosingWeight =
    filledData.length > 1 &&
    filledData[0].weight > filledData[filledData.length - 1].weight;

  const color = isLosingWeight ? '#ef4444' : '#22c55e'; // green or red

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg shadow mt-6">
      <h3 className="text-lg font-bold text-pink-400 mb-4">📉 Weekly Weight Progress</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={filledData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(date) => format(parseISO(date), 'MM-dd')}
            tick={{ fill: '#ccc', fontSize: 12 }}
          />
          <YAxis
            domain={[98, 102]}
            tick={{ fill: '#ccc', fontSize: 12 }}
            allowDecimals={true}
            ticks={Array.from({ length: 71 }, (_, i) => 98 + i * 0.1).map(v => parseFloat(v.toFixed(1)))}
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
