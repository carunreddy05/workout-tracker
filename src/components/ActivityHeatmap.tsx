import React, { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, addDays, eachDayOfInterval } from 'date-fns';
import type { Session } from '@/types/WorkoutEntry';
import { getWeekBounds, toDateKey } from '@/utils/week';

interface ActivityHeatmapProps {
  sessions: Session[];
  onDateClick?: (session: Session) => void;
}

export default function ActivityHeatmap({ sessions, onDateClick }: ActivityHeatmapProps) {
  const [view, setView] = useState<'week' | 'month' | 'year'>('month');

  // Build a set of workout dates for quick lookup
  const workoutDates = useMemo(() => {
    return new Set(sessions.map(s => s.date));
  }, [sessions]);

  // Week view: current calendar week (Sunday to Saturday), from the shared
  // week utility — must match the "this week" definition used on Home.
  const weekDays = useMemo(() => {
    const { start } = getWeekBounds();
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, []);

  // Month view: current month
  const monthDays = useMemo(() => {
    const today = new Date();
    const start = startOfMonth(today);
    const end = endOfMonth(today);
    return eachDayOfInterval({ start, end });
  }, []);

  // Year view: last 12 months as calendar grids
  const yearMonths = useMemo(() => {
    const today = new Date();
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      const days = eachDayOfInterval({ start, end });

      // Get days from previous month to fill the grid
      const firstDay = start.getDay();
      const prevMonthDays = Array.from({ length: firstDay }, (_, i) =>
        addDays(start, -(firstDay - i))
      );

      months.push({
        monthYear: format(date, 'MMM yyyy'),
        days: [...prevMonthDays, ...days],
      });
    }
    return months;
  }, []);

  const hasWorkout = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return workoutDates.has(dateStr);
  };

  const getSessionForDate = (date: Date): Session | undefined => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return sessions.find(s => s.date === dateStr);
  };

  const DayDot = ({ date, label }: { date: Date; label?: string }) => {
    const workout = hasWorkout(date);
    const session = workout ? getSessionForDate(date) : undefined;

    const handleClick = () => {
      if (session && onDateClick) {
        onDateClick(session);
      }
    };

    return (
      <div className="flex flex-col items-center gap-1">
        <div
          onClick={handleClick}
          className="w-6 h-6 rounded-md transition-all hover:scale-110 active:scale-95"
          title={format(date, 'MMM d, yyyy')}
          style={{
            background: workout ? 'var(--tf-accent)' : 'var(--tf-surface2)',
            border: `1px solid ${workout ? 'var(--tf-accent)' : 'var(--tf-line)'}`,
            cursor: workout ? 'pointer' : 'default',
          }}
        />
        {label && (
          <span className="text-xs" style={{ color: 'var(--tf-mute)' }}>
            {label}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="px-6 py-4 border-t" style={{ borderColor: 'var(--tf-line)' }}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--tf-ink)' }}>
          Your Activity
        </p>
        <div className="flex gap-2">
          {(['week', 'month', 'year'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="px-3 py-1 rounded-full text-xs font-semibold transition-all capitalize"
              style={{
                background: view === v ? 'var(--tf-accent)' : 'transparent',
                color: view === v ? 'var(--tf-accent-ink)' : 'var(--tf-mute)',
                border: `1px solid ${view === v ? 'var(--tf-accent)' : 'var(--tf-line)'}`,
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Week View */}
      {view === 'week' && (
        <div className="flex gap-2 justify-between">
          {weekDays.map((date, idx) => (
            <DayDot key={idx} date={date} label={format(date, 'EEE').slice(0, 1)} />
          ))}
        </div>
      )}

      {/* Month View */}
      {view === 'month' && (
        <div>
          <p className="text-xs mb-2" style={{ color: 'var(--tf-mute2)' }}>
            {format(new Date(), 'MMMM yyyy')}
          </p>
          <div className="grid grid-cols-7 gap-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
              <p key={day} className="text-xs text-center font-semibold" style={{ color: 'var(--tf-mute)' }}>
                {day}
              </p>
            ))}
            {monthDays.map((date, idx) => (
              <DayDot key={idx} date={date} />
            ))}
          </div>
        </div>
      )}

      {/* Year View */}
      {view === 'year' && (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {yearMonths.map((month, idx) => (
            <div key={idx}>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--tf-mute)' }}>
                {month.monthYear}
              </p>
              <div className="grid grid-cols-7 gap-1">
                {/* Day headers */}
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                  <p key={day} className="text-xs text-center" style={{ color: 'var(--tf-mute2)', fontSize: '10px' }}>
                    {day}
                  </p>
                ))}
                {/* Days */}
                {month.days.slice(0, 35).map((date, dayIdx) => {
                  const isCurrentMonth =
                    format(date, 'MMM yyyy') === month.monthYear;
                  const workout = hasWorkout(date);
                  const session = workout ? getSessionForDate(date) : undefined;

                  const handleClick = () => {
                    if (session && onDateClick) {
                      onDateClick(session);
                    }
                  };

                  return (
                    <div
                      key={dayIdx}
                      onClick={handleClick}
                      className="w-5 h-5 rounded-sm transition-all hover:scale-110 active:scale-95"
                      title={isCurrentMonth ? format(date, 'MMM d, yyyy') : ''}
                      style={{
                        background: isCurrentMonth
                          ? workout
                            ? 'var(--tf-accent)'
                            : 'var(--tf-surface2)'
                          : 'transparent',
                        border: isCurrentMonth
                          ? `1px solid ${workout ? 'var(--tf-accent)' : 'var(--tf-line)'}`
                          : 'none',
                        cursor: isCurrentMonth && workout ? 'pointer' : isCurrentMonth ? 'default' : 'default',
                        opacity: isCurrentMonth ? 1 : 0.3,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-4 items-center mt-4 pt-3 border-t" style={{ borderColor: 'var(--tf-line)' }}>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-sm"
            style={{ background: 'var(--tf-surface2)', border: '1px solid var(--tf-line)' }}
          />
          <span className="text-xs" style={{ color: 'var(--tf-mute2)' }}>
            No workout
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-sm"
            style={{ background: 'var(--tf-accent)', border: '1px solid var(--tf-accent)' }}
          />
          <span className="text-xs" style={{ color: 'var(--tf-mute2)' }}>
            Worked out
          </span>
        </div>
      </div>
    </div>
  );
}
