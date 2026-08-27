import { useEffect, useState } from 'react';

/** Live "MM:SS" (or "H:MM:SS" past an hour) elapsed since `startedAtIso`. */
export function useElapsedLabel(startedAtIso: string | undefined): string {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!startedAtIso) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startedAtIso]);

  if (!startedAtIso) return '0:00';

  const elapsedSeconds = Math.max(0, Math.floor((now - new Date(startedAtIso).getTime()) / 1000));
  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;

  const mm = hours > 0 ? String(minutes).padStart(2, '0') : String(minutes);
  const ss = String(seconds).padStart(2, '0');
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}
