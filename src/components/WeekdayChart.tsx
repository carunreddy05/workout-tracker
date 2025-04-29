import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { parse, subDays, isAfter, startOfMonth } from 'date-fns';

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function WeekdayChart({ entries }: { entries: any[] }) {
  const [range, setRange] = useState<'month' | '30days'>('month');

  const weekdayCount: Record<string, number> = {
    Sun: 0,
    Mon: 0,
    Tue: 0,
    Wed: 0,
    Thu: 0,
    Fri: 0,
    Sat: 0,
  };

  entries.forEach(entry => {
    const rawDate = entry.dateDay?.split(' - ')[0];
    const date = parse(rawDate, 'yyyy-MM-dd', new Date());

    const isInRange =
      range === 'month'
        ? date >= startOfMonth(new Date())
        : isAfter(date, subDays(new Date(), 30));

    if (!isNaN(date as any) && isInRange) {
      const day = daysOfWeek[date.getDay()];
      weekdayCount[day]++;
    }
  });

  // Reorder for chart: Mon to Sun
  const chartOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const data = chartOrder.map(day => ({
    day,
    count: weekdayCount[day],
  }));

  return (
<div className="bg-[#1e1b2e] border border-zinc-700 p-4 rounded-md mt-6">
<div className="flex justify-between items-center mb-3">
        <h3 className="text-indigo-300 font-semibold">
          📈 Workout Frequency by Weekday
          <span className="ml-2 text-sm text-zinc-400">
            ({range === 'month' ? 'This Month' : 'Last 30 Days'})
          </span>
        </h3>
        <div className="w-48">
          <Select value={range} onValueChange={val => setRange(val as 'month' | '30days')}>
            <SelectTrigger className="bg-zinc-700 text-white border-zinc-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">📅 This Month</SelectItem>
              <SelectItem value="30days">🔄 Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
          <XAxis dataKey="day" stroke="#e4e4e7" />
          <YAxis stroke="#e4e4e7" allowDecimals={false} />
          <Tooltip
            contentStyle={{ backgroundColor: '#2a2737', borderColor: '#444' }}
            labelStyle={{ color: '#e0e7ff', fontWeight: 'bold' }}
            itemStyle={{ color: '#d8b4fe' }}
            />
          <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]}   activeBar={{ fill: '#c084fc' }}          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
