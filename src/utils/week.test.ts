import { describe, it, expect, afterEach } from 'vitest';
import { parseDateKey, toDateKey, todayKey, getWeekBounds, isDateKeyInWeek } from './week';

const ORIGINAL_TZ = process.env.TZ;

function withTZ(tz: string, fn: () => void) {
  process.env.TZ = tz;
  try {
    fn();
  } finally {
    process.env.TZ = ORIGINAL_TZ;
  }
}

describe('parseDateKey / toDateKey round-trip safety', () => {
  afterEach(() => {
    process.env.TZ = ORIGINAL_TZ;
  });

  it('round-trips a date key through local midnight', () => {
    expect(toDateKey(parseDateKey('2026-08-24'))).toBe('2026-08-24');
  });

  it('does NOT roll back a day for timezones west of UTC (the new Date(string) bug)', () => {
    withTZ('America/New_York', () => {
      const d = parseDateKey('2026-08-24');
      expect(d.getFullYear()).toBe(2026);
      expect(d.getMonth()).toBe(7); // August, 0-indexed
      expect(d.getDate()).toBe(24);
    });
  });

  it('does NOT roll forward a day for timezones east of UTC (the toISOString() bug)', () => {
    withTZ('Asia/Kolkata', () => {
      const d = parseDateKey('2026-08-24');
      expect(toDateKey(d)).toBe('2026-08-24');
    });
  });

  it('toDateKey never crosses a UTC day boundary for local midnight, in either direction', () => {
    for (const tz of ['America/Los_Angeles', 'America/New_York', 'UTC', 'Asia/Kolkata', 'Pacific/Auckland']) {
      withTZ(tz, () => {
        const localMidnight = new Date(2026, 7, 24, 0, 0, 0, 0); // Aug 24, local midnight
        expect(toDateKey(localMidnight)).toBe('2026-08-24');
      });
    }
  });

  it('todayKey matches a freshly constructed local date key', () => {
    const now = new Date();
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    expect(todayKey()).toBe(expected);
  });
});

describe('getWeekBounds', () => {
  it('returns Sunday 00:00:00.000 through Saturday 23:59:59.999 for a mid-week date', () => {
    // 2026-08-19 is a Wednesday
    const { start, end } = getWeekBounds(parseDateKey('2026-08-19'));
    expect(toDateKey(start)).toBe('2026-08-16'); // Sunday
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(toDateKey(end)).toBe('2026-08-22'); // Saturday
    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
  });

  it('a Sunday reference date is its own week start', () => {
    const { start } = getWeekBounds(parseDateKey('2026-08-16'));
    expect(toDateKey(start)).toBe('2026-08-16');
  });

  it('a Saturday reference date is its own week end', () => {
    const { end } = getWeekBounds(parseDateKey('2026-08-22'));
    expect(toDateKey(end)).toBe('2026-08-22');
  });

  it('handles a week that spans a month boundary', () => {
    // 2026-01-31 is a Saturday; that week starts 2026-01-25
    const { start, end } = getWeekBounds(parseDateKey('2026-01-31'));
    expect(toDateKey(start)).toBe('2026-01-25');
    expect(toDateKey(end)).toBe('2026-01-31');
  });

  it('handles a week that spans a year boundary', () => {
    // 2027-01-01 is a Friday; that week starts 2026-12-27
    const { start, end } = getWeekBounds(parseDateKey('2027-01-01'));
    expect(toDateKey(start)).toBe('2026-12-27');
    expect(toDateKey(end)).toBe('2027-01-02');
  });
});

describe('isDateKeyInWeek', () => {
  const wednesday = parseDateKey('2026-08-19');

  it('includes the week boundaries', () => {
    expect(isDateKeyInWeek('2026-08-16', wednesday)).toBe(true); // Sunday
    expect(isDateKeyInWeek('2026-08-22', wednesday)).toBe(true); // Saturday
  });

  it('excludes the day just before/after the week', () => {
    expect(isDateKeyInWeek('2026-08-15', wednesday)).toBe(false);
    expect(isDateKeyInWeek('2026-08-23', wednesday)).toBe(false);
  });

  it('rejects a date 5 days ago that falls in the PREVIOUS calendar week (the rolling-7-day bug)', () => {
    // Reference: Tuesday 2026-08-25. Five days ago is Thursday 2026-08-20,
    // which is in the PREVIOUS calendar week (that week ran Aug 16-22).
    // A rolling "now - 7 days" window would wrongly count this as "this week".
    const tuesday = parseDateKey('2026-08-25');
    expect(isDateKeyInWeek('2026-08-20', tuesday)).toBe(false);
  });

  it('handles a DST-transition week (US spring-forward, 2026-03-08) without misbucketing boundary days', () => {
    const midweek = parseDateKey('2026-03-10'); // Tuesday, week of Mar 8-14
    expect(isDateKeyInWeek('2026-03-08', midweek)).toBe(true); // the DST-transition Sunday itself
    expect(isDateKeyInWeek('2026-03-07', midweek)).toBe(false); // day before, previous week
  });

  it('handles a DST-transition week (US fall-back, 2026-11-01) without misbucketing boundary days', () => {
    const midweek = parseDateKey('2026-11-03'); // Tuesday, week of Nov 1-7
    expect(isDateKeyInWeek('2026-11-01', midweek)).toBe(true); // the DST-transition Sunday itself
    expect(isDateKeyInWeek('2026-10-31', midweek)).toBe(false); // day before, previous week
  });
});
