// src/components/WeightChart.tsx
import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area
} from 'recharts';
import { format, startOfYear, subDays } from 'date-fns';

interface WeightEntry {
  dateDay: string;
  weight?: number;
}

interface Props {
  entries: WeightEntry[];
}

type TimeRange = '7D' | '30D' | 'YTD' | 'ALL';
type WeightUnit = 'kg' | 'lb';

interface ChartDataPoint {
  date: string;
  weight: number | undefined;
}

export default function WeightChart({ entries }: Props) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30D');
  const [unit, setUnit] = useState<WeightUnit>('kg');

  // Helper to extract just the date part from dateDay
  const getDate = (dateDay: string) => dateDay.split(' ')[0];

  const now = new Date();
  const rangeDate = {
    '7D': subDays(now, 7),
    '30D': subDays(now, 30),
    'YTD': startOfYear(now),
    ALL: undefined
  }[timeRange];

  const convertWeight = (value?: number) => {
    if (value === undefined) return undefined;
    return unit === 'kg' ? value : Number((value * 2.20462).toFixed(1));
  };

  const chartData: ChartDataPoint[] = useMemo(() => {
    const sortedEntries = [...entries].sort((a, b) =>
      a.dateDay > b.dateDay ? 1 : -1
    );

    return sortedEntries.reduce<ChartDataPoint[]>((acc, entry) => {
      const date = getDate(entry.dateDay);
      const entryDate = new Date(date);

      if (rangeDate && entryDate < rangeDate) {
        return acc;
      }

      acc.push({
        date,
        weight: convertWeight(entry.weight)
      });

      return acc;
    }, []);
  }, [entries, rangeDate, unit]);

  const weights = chartData
    .map((d) => d.weight)
    .filter((w): w is number => w !== undefined);

  const defaultMin = unit === 'kg' ? 60 : 130;
  const defaultMax = unit === 'kg' ? 100 : 230;
  const minWeight =
    weights.length > 0 ? Math.floor(Math.min(...weights) - 1) : defaultMin;
  const maxWeight =
    weights.length > 0 ? Math.ceil(Math.max(...weights) + 1) : defaultMax;

  const xTickFormatter = (date: string) => {
    const d = new Date(date);
    if (timeRange === '7D' || timeRange === '30D') {
      return format(d, 'MMM d');
    }
    return format(d, 'MMM');
  };

  const tooltipFormatter = (value: number | string | Array<number | string>) => {
    if (typeof value === 'number') {
      return [`${value} ${unit}`, 'Weight'];
    }
    return value;
  };

  const tooltipLabelFormatter = (date: string) =>
    format(new Date(date), 'MMMM d, yyyy');

  return (
    <div className="w-full">
      <div className="rounded-[28px] border border-emerald-500/10 bg-[#041106] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">Weekly Progress</p>
        <div className="mt-1 flex items-end justify-between">
          <h2 className="text-3xl font-semibold text-white">Weight</h2>
          <div className="flex items-center gap-2 rounded-full bg-black/40 p-1 text-xs font-medium uppercase text-zinc-400">
            {(['kg', 'lb'] as WeightUnit[]).map((value) => (
              <button
                key={value}
                onClick={() => setUnit(value)}
                className={[
                  'rounded-full px-3 py-1 transition',
                  unit === value
                    ? 'bg-emerald-400 text-black shadow-[0_8px_18px_rgba(34,197,94,0.5)]'
                    : ''
                ].join(' ')}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-full bg-black/40 p-1 text-[13px] font-semibold text-zinc-400">
          {[
            { label: 'Last 7 Days', value: '7D' },
            { label: 'Last 30 Days', value: '30D' },
            { label: 'YTD', value: 'YTD' },
            { label: 'All', value: 'ALL' }
          ].map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setTimeRange(value as TimeRange)}
              className={[
                'flex-1 rounded-full px-3 py-2 transition',
                timeRange === value
                  ? 'bg-gradient-to-r from-emerald-400 to-lime-400 text-emerald-950'
                  : ''
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-6 h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 10, bottom: 10, left: 0 }}
            >
              <defs>
                <linearGradient id="weightLine" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#041106" stopOpacity={0.05} />
                </linearGradient>
              </defs>

              <CartesianGrid
                stroke="#1a2b1c"
                strokeDasharray="6 6"
                vertical={false}
              />

              <XAxis
                dataKey="date"
                stroke="#4b5b4d"
                tickFormatter={xTickFormatter}
                tickLine={false}
                axisLine={false}
                padding={{ left: 10, right: 10 }}
              />

              <YAxis
                domain={[minWeight, maxWeight]}
                stroke="#4b5b4d"
                tickCount={5}
                tickLine={false}
                axisLine={false}
              />

              <Tooltip
                formatter={tooltipFormatter}
                labelFormatter={tooltipLabelFormatter}
                contentStyle={{
                  backgroundColor: '#050b07',
                  border: '1px solid rgba(74, 222, 128, 0.2)',
                  borderRadius: '12px',
                  color: '#f0fdf4',
                  textTransform: 'capitalize'
                }}
              />

              <Area
                type="monotone"
                dataKey="weight"
                stroke="none"
                fill="url(#weightFill)"
                isAnimationActive={false}
              />

              <Line
                type="monotone"
                dataKey="weight"
                stroke="url(#weightLine)"
                strokeWidth={3}
                dot={{
                  r: 4,
                  fill: '#041106',
                  stroke: '#22c55e',
                  strokeWidth: 3
                }}
                activeDot={{
                  r: 6,
                  strokeWidth: 0,
                  fill: '#a7f3d0'
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
