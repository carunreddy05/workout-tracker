// src/components/Layout.tsx
import React from 'react';
import Header from './Header';
import { Link } from 'react-router-dom';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 relative pb-16 sm:pb-0">
      <Header />
      <main className="p-4 max-w-5xl mx-auto">{children}</main>

      {/* Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 border-t border-zinc-800 text-white flex justify-around py-2 sm:hidden">
        <Link to="/" className="flex flex-col items-center text-xs hover:text-indigo-400">
          <span>🏠</span>
          <span>Home</span>
        </Link>
        <Link to="/entry" className="flex flex-col items-center text-xs hover:text-indigo-400">
          <span>📝</span>
          <span>Log</span>
        </Link>
        <Link to="/history" className="flex flex-col items-center text-xs hover:text-indigo-400">
          <span>📂</span>
          <span>History</span>
        </Link>
      </div>
    </div>
  );
}
