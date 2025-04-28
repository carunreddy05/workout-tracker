import React, { useEffect, useState } from 'react';

export default function DateTimeAndWeather() {
  const [dateTime, setDateTime] = useState('');
  const [weather, setWeather] = useState<{ temp: string; emoji: string } | null>(null);
  const [location, setLocation] = useState('Atlanta');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        month: '2-digit', day: '2-digit', year: '2-digit',
        hour: 'numeric', minute: '2-digit', hour12: true,
        timeZone: 'America/New_York'
      };
      setDateTime(new Intl.DateTimeFormat('en-US', options).format(now));
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      fetchWeather('Atlanta');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        fetchCityName(latitude, longitude);
        fetchWeather(`${latitude},${longitude}`);
      },
      () => fetchWeather('Atlanta')
    );
  }, []);

  const fetchCityName = (lat: number, lon: number) => {
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`)
      .then(res => res.json())
      .then(data => {
        if (data.address?.city || data.address?.town || data.address?.village) {
          setLocation(data.address.city || data.address.town || data.address.village);
        }
      })
      .catch(() => setLocation('Your City'));
  };

  const fetchWeather = (loc: string) => {
    fetch(`https://wttr.in/${loc}?format=%t|%c`)
      .then(res => res.text())
      .then(data => {
        const [temp, emoji] = data.split('|');
        if (temp && emoji) setWeather({ temp: temp.trim(), emoji: emoji.trim() });
        else setWeather(null);
      })
      .catch(() => setWeather(null));
  };

  return (
    <div className="text-sm text-gray-300 mb-4 w-full flex justify-between items-center px-1 py-1 bg-gray-800 rounded-lg shadow-inner">
      <div className="font-mono text-left">
        <span className="text-yellow-300">🕒</span> {dateTime}
      </div>
      <div className="flex items-center gap-2 font-mono">
        <span className="text-blue-300">📍{location}</span>
        {weather ? (
          <span className="text-green-300">{weather.emoji} {weather.temp}</span>
        ) : (
          <span>🌡️ N/A</span>
        )}
      </div>
    </div>
  );
}