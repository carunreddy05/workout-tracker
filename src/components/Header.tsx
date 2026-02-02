// src/components/Header.tsx
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import TrackfitMark from './TrackfitMark';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebase';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const links = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Add Workout', path: '/entry' },
    { name: 'Workout History', path: '/history' },
  ];

  const navLinkClasses = (path: string, isGann: boolean) => {
    const isActive = location.pathname === path;
    if (isGann) {
      return 'px-3 py-1 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 text-xs font-semibold uppercase tracking-wide shadow-lg shadow-rose-500/25';
    }
    return [
      'px-4 py-1 rounded-full text-sm font-medium transition',
      isActive ? 'bg-emerald-500 text-black' : 'text-zinc-400 hover:text-white',
    ].join(' ');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setMenuOpen(false);
      navigate('/login', { replace: true });
    } catch {
      // swallow error for now; could add toast later
    }
  };

  return (
    <header className="border-b border-[#15161a] bg-[#07080b]/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/30 bg-gradient-to-b from-[#0f2118] to-[#041006]">
            <TrackfitMark size={36} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.5em] text-emerald-300">Trackfit</p>
            <p className="text-lg font-semibold text-white">Performance</p>
          </div>
        </Link>

        <button
          className="md:hidden rounded-full border border-white/10 p-2 text-white"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <Menu className="h-5 w-5" />
        </button>
        <nav className="hidden items-center gap-3 md:flex">
          {links.map(link => {
            const isGann = link.name.toLowerCase().includes('gann');
            return (
              <Link key={link.name} to={link.path} className={navLinkClasses(link.path, isGann)}>
                {link.name}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={handleLogout}
            className="ml-2 rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-zinc-300 transition hover:border-emerald-400/60 hover:text-white"
          >
            Logout
          </button>
        </nav>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="space-y-3 border-t border-[#15161a] bg-[#050609] px-4 pb-5 pt-4 text-sm md:hidden">
          {links.map(link => {
            const isGann = link.name.toLowerCase().includes('gann');
            return (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setMenuOpen(false)}
                className={[
                  'block rounded-full px-4 py-3 text-center font-semibold transition',
                  isGann
                    ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white'
                    : 'bg-[#111216] text-zinc-300 hover:text-white',
                ].join(' ')}
              >
                {link.name}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 block w-full rounded-full bg-[#1b1c22] px-4 py-3 text-center font-semibold text-zinc-100 transition hover:bg-[#22242b]"
          >
            Logout
          </button>
        </div>
      )}
    </header>
  );
}
