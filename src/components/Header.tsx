// src/components/Header.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { name: 'Dashboard', path: '/' },
    { name: 'Add Workout', path: '/entry' },
    { name: 'Workout History', path: '/history' },
  ];

  return (
    <header className="bg-zinc-900 text-white shadow-md">
        
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
      <Link to="/" className="flex items-center gap-2">
        <img src="../src/assets/trackfit-logo.png" alt="TrackFit app logo" className="w-20 h-20 transition-transform hover:scale-105"
/>
    </Link>
        <button
          className="md:hidden text-white focus:outline-none"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>
        <nav className="hidden md:flex space-x-6 text-sm">
          {links.map(link => (
            <Link key={link.name} to={link.path} className="hover:text-indigo-300">
              {link.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-zinc-800 px-4 pb-4 space-y-2">
          {links.map(link => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setMenuOpen(false)}
              className="block text-sm text-white hover:text-indigo-400"
            >
              {link.name}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
