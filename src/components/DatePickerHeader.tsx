import React, { useState, useRef, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight, AlertCircle, Calendar } from 'lucide-react';
import { todayKey, parseDateKey } from '@/utils/week';

interface DatePickerHeaderProps {
  selectedDate: string; // "yyyy-MM-dd"
  onDateChange: (date: string) => void;
  hasExistingData: boolean;
  onExistingDataClick?: () => void;
}

export default function DatePickerHeader({
  selectedDate,
  onDateChange,
  hasExistingData,
  onExistingDataClick,
}: DatePickerHeaderProps) {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const today = todayKey();
  const selectedDateObj = parseDateKey(selectedDate);
  const isToday = selectedDate === today;
  const isPast = selectedDate < today;

  // Generate last 30 days
  const last30Days = Array.from({ length: 30 }, (_, i) =>
    format(addDays(new Date(), -i), 'yyyy-MM-dd')
  ).reverse();

  // Close picker when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    if (showPicker) {
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }
  }, [showPicker]);

  const handleDateClick = (date: string) => {
    onDateChange(date);
    setShowPicker(false);
  };

  const handlePrevDay = () => {
    const prev = format(addDays(selectedDateObj, -1), 'yyyy-MM-dd');
    if (last30Days.includes(prev)) {
      onDateChange(prev);
    }
  };

  const handleNextDay = () => {
    const next = format(addDays(selectedDateObj, 1), 'yyyy-MM-dd');
    if (last30Days.includes(next)) {
      onDateChange(next);
    }
  };

  return (
    <div
      className="px-6 py-6 border-b relative"
      style={{ borderColor: 'var(--tf-line)' }}
    >
      <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--tf-mute)' }}>
        {isToday ? "Today's Workout" : 'Select Workout Date'}
      </p>

      {/* Date display with picker trigger */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="flex items-center gap-2 text-left transition-all hover:opacity-80 active:scale-95 w-full"
          >
            <Calendar className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--tf-accent)' }} />
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--tf-ink)' }}>
                {format(selectedDateObj, 'EEEE, MMM d')}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--tf-mute)' }}>
                Tap to change date
              </p>
            </div>
          </button>

          {/* Warning badge for past dates */}
          {isPast && !isToday && (
            <div className="flex items-center gap-2 mt-2">
              <AlertCircle className="w-4 h-4" style={{ color: 'var(--tf-accent)' }} />
              <p className="text-xs font-semibold" style={{ color: 'var(--tf-accent)' }}>
                Editing past workout
              </p>
            </div>
          )}

          {/* Existing data message */}
          {hasExistingData && !isToday && (
            <button
              onClick={onExistingDataClick}
              className="mt-2 text-xs font-semibold transition-opacity hover:opacity-80 text-left"
              style={{ color: 'var(--tf-accent)' }}
            >
              Data already entered • Go to History →
            </button>
          )}
        </div>

        {/* Quick nav buttons */}
        <div className="flex gap-2">
          <button
            onClick={handlePrevDay}
            disabled={selectedDate === last30Days[0]}
            className="p-2 rounded-lg transition disabled:opacity-30"
            style={{
              background: 'var(--tf-surface)',
              border: '1px solid var(--tf-line)',
              color: 'var(--tf-mute)',
            }}
            aria-label="Previous day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNextDay}
            disabled={selectedDate === last30Days[last30Days.length - 1]}
            className="p-2 rounded-lg transition disabled:opacity-30"
            style={{
              background: 'var(--tf-surface)',
              border: '1px solid var(--tf-line)',
              color: 'var(--tf-mute)',
            }}
            aria-label="Next day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Date picker dropdown */}
      {showPicker && (
        <div
          ref={pickerRef}
          className="absolute top-full left-6 right-6 mt-2 rounded-xl z-50 p-4 max-h-80 overflow-y-auto"
          style={{
            background: 'var(--tf-surface2)',
            border: '1px solid var(--tf-line)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--tf-mute)' }}>
              Last 30 Days
            </p>
            <p className="text-xs" style={{ color: 'var(--tf-mute2)' }}>
              Tap any date to log a previous workout
            </p>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {last30Days.map(date => {
              const isSelected = date === selectedDate;
              const dateObj = parseDateKey(date);
              const day = format(dateObj, 'd');
              const isCurrentDate = date === today;
              const dayOfWeek = format(dateObj, 'EEE');

              return (
                <div key={date} className="flex flex-col items-center">
                  <button
                    onClick={() => handleDateClick(date)}
                    className="h-9 w-9 rounded-lg text-xs font-semibold transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: isSelected ? 'var(--tf-accent)' : isCurrentDate ? 'var(--tf-accent)' : 'var(--tf-surface)',
                      color: isSelected || isCurrentDate ? 'var(--tf-accent-ink)' : 'var(--tf-ink)',
                      border: `1px solid ${isSelected ? 'var(--tf-accent)' : isCurrentDate ? 'var(--tf-accent)' : 'var(--tf-line)'}`,
                      cursor: 'pointer',
                    }}
                    title={format(dateObj, 'EEEE, MMM d')}
                  >
                    {day}
                  </button>
                  <span className="text-xs mt-1" style={{ color: 'var(--tf-mute2)', fontSize: '9px' }}>
                    {dayOfWeek}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t" style={{ borderColor: 'var(--tf-line)' }}>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ background: 'var(--tf-accent)' }}
              />
              <p className="text-xs" style={{ color: 'var(--tf-mute2)' }}>
                {today === selectedDate ? 'Today' : 'Selected'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
