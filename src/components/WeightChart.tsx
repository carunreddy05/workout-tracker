// src/components/WeightChart.tsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function WeightChart({ entries }: { entries: any[] }) {
  const data = entries
    .filter(e => e.weight)
    .sort((a, b) => new Date(a.dateDay).getTime() - new Date(b.dateDay).getTime())
    .map(e => ({
      date: e.dateDay.split(' - ')[0].slice(5), // MM-DD
      weight: parseFloat(e.weight),
    }));

  return (
    <div className="bg-zinc-800 p-4 rounded-lg border border-zinc-700">
      <h3 className="text-lg font-bold text-pink-400 mb-2">📈 Weekly Weight Progress</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#555" />
          <XAxis dataKey="date" stroke="#ccc" />
          <YAxis stroke="#ccc" />
          <Tooltip />
          <Line type="monotone" dataKey="weight" stroke="#ec4899" strokeWidth={2} dot />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
