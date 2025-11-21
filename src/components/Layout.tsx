// src/components/Layout.tsx
import React from 'react';
import Header from './Header';
import { Link, NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { Dumbbell, History, Home, NotebookPen } from 'lucide-react';

type NavItem = {
  to: string;
  label: string;
  Icon: LucideIcon;
};

const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', Icon: Home },
  { to: '/entry', label: 'Log', Icon: NotebookPen },
  { to: '/history', label: 'History', Icon: History },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 relative pb-36 sm:pb-0">
      <Header />
      <main className="p-4 max-w-5xl mx-auto">{children}</main>

      {/* Mobile Bottom CTA + Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/95 via-black/80 to-black/20 px-4 pb-4 pt-6 sm:hidden">
        <div className="max-w-md mx-auto space-y-4">
          <Link
            to="/entry"
            className="flex items-center justify-center gap-2 rounded-3xl bg-gradient-to-r from-emerald-400 to-lime-400 py-3 text-base font-semibold text-emerald-950 shadow-[0_10px_35px_rgba(34,197,94,0.45)] transition hover:shadow-[0_15px_40px_rgba(34,197,94,0.6)]"
          >
            <Dumbbell className="h-5 w-5" />
            Start New Workout
          </Link>

          <nav className="flex items-center gap-3 rounded-[30px] border border-emerald-500/25 bg-[#050f08] px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-zinc-400 shadow-[0_10px_40px_rgba(0,0,0,0.65)]">
            {navItems.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  [
                    'relative flex flex-1 flex-col items-center rounded-2xl px-3 py-2 transition',
                    isActive
                      ? 'text-white'
                      : 'text-zinc-500 hover:text-zinc-200',
                  ].join(' ')
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={[
                        'flex h-9 w-9 items-center justify-center rounded-2xl transition',
                        isActive
                          ? 'bg-gradient-to-b from-emerald-500/25 to-lime-400/10 text-lime-300'
                          : 'bg-zinc-900/60 text-zinc-500',
                      ].join(' ')}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </div>
                    <span className="mt-1 text-[11px] tracking-tight">{label}</span>
                    {isActive && (
                      <span className="absolute -bottom-1 h-1 w-10 rounded-full bg-lime-400/70 blur-[1px]" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
