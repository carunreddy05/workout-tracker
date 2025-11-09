// src/components/WeightChart.tsx
import React, { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { format, subDays, subMonths } from 'date-fns';

interface WeightEntry {
  dateDay: string;
  weight?: number;
}

interface Props {
  entries: WeightEntry[];
}

type TimeRange = '1W' | '1M' | '6M';

interface ChartDataPoint {
  date: string;
  weight: number | undefined;
}

export default function WeightChart({ entries }: Props) {
  const [timeRange, setTimeRange] = useState<TimeRange>('1W');

  // Helper to extract just the date part from dateDay
  const getDate = (dateDay: string) => dateDay.split(' ')[0];

  // Process and prepare data
  const now = new Date();
  const filterDate = {
    '1W': subDays(now, 7),
    '1M': subMonths(now, 1),
    '6M': subMonths(now, 6)
  }[timeRange];

  // Sort entries and fill in gaps
  const chartData: ChartDataPoint[] = entries
    .sort((a, b) => (a.dateDay > b.dateDay ? 1 : -1))
    .reduce<ChartDataPoint[]>((acc, entry) => {
      const date = getDate(entry.dateDay);
      if (new Date(date) >= filterDate) {
        acc.push({
          date,
          weight: entry.weight
        });
      }
      return acc;
    }, []);

  // Calculate min/max for chart scaling
  const weights = chartData
    .map(d => d.weight)
    .filter((w): w is number => w !== undefined);
  
  const minWeight = weights.length > 0 ? Math.floor(Math.min(...weights) - 1) : 60;
  const maxWeight = weights.length > 0 ? Math.ceil(Math.max(...weights) + 1) : 100;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-medium text-white">Weekly Weight Progress</h2>
        <div className="flex gap-2">
          {(['1W', '1M', '6M'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors
                ${timeRange === range 
                  ? 'bg-[#00ff00] text-black'
                  : 'bg-[#1f2937] text-gray-400 hover:bg-[#374151]'
                }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#0B0B0F] rounded-[24px] p-6">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={chartData} 
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <CartesianGrid
                stroke="#2D2D2D"
                strokeDasharray="4 4"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                stroke="#6B7280"
                tickFormatter={(date) => format(new Date(date), 'MMM d')}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[minWeight, maxWeight]}
                stroke="#6B7280"
                tickCount={5}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181B',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                labelFormatter={(date) => format(new Date(date), 'MMMM d, yyyy')}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#00ff00"
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: '#00ff00',
                  stroke: '#00ff00',
                  strokeWidth: 2
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}