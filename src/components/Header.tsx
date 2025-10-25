// src/components/Header.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '@/assets/trackfit-logo.png'; 

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { name: 'Dashboard', path: '/' },
    { name: 'Add Workout', path: '/entry' },
    { name: 'GANN THEORY', path: '/gann' },
    { name: 'Workout History', path: '/history' },
  ];

  return (
    <header className="bg-black text-white shadow-md">
        
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
      <Link to="/" className="flex items-center gap-2">
        <img src={logo} alt="TrackFit app logo" className="w-20 h-20 transition-transform hover:scale-105" />
        </Link>
     
        <button
          className="md:hidden text-white focus:outline-none"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>
        <nav className="hidden md:flex space-x-6 text-sm items-center">
          {links.map(link => {
            const isGann = link.name.toLowerCase().includes('gann');
            return (
              <Link
                key={link.name}
                to={link.path}
                className={
                  isGann
                    ? 'px-3 py-1 rounded-md bg-gradient-to-br from-pink-600 to-pink-800 text-white font-semibold uppercase text-xs shadow-sm hover:brightness-95'
                    : 'hover:text-indigo-300'
                }
              >
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-zinc-800 px-4 pb-4 space-y-2">
          {links.map(link => {
            const isGann = link.name.toLowerCase().includes('gann');
            return (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setMenuOpen(false)}
                className={
                  isGann
                    ? 'block text-sm text-white px-3 py-2 rounded bg-pink-700/80 font-semibold uppercase'
                    : 'block text-sm text-white hover:text-indigo-400'
                }
              >
                {link.name}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
