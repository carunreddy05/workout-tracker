import React from 'react';
import Header from './Header';
import { NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { Dumbbell, History, Home } from 'lucide-react';

type NavItem = { to: string; label: string; Icon: LucideIcon };

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Home', Icon: Home },
  { to: '/train', label: 'Train', Icon: Dumbbell },
  { to: '/history', label: 'History', Icon: History },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-28" style={{ background: 'var(--tf-bg)', color: 'var(--tf-ink)' }}>
      <Header />
      <main className="px-4 pt-4 pb-4 max-w-5xl mx-auto">{children}</main>

      {/* Bottom tab bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-5 pt-4"
        style={{ background: 'linear-gradient(to top, var(--tf-bg) 65%, transparent)' }}
      >
        <nav
          className="mx-auto flex max-w-xs items-center rounded-full p-1.5 gap-1"
          style={{
            background: 'var(--tf-surface)',
            border: '1px solid var(--tf-line)',
          }}
        >
          {navItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              className={({ isActive }) =>
                [
                  'flex flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-[13px] font-medium transition-all duration-150',
                  isActive
                    ? 'text-[var(--tf-accent-ink)]'
                    : 'text-[var(--tf-mute)] hover:text-[var(--tf-ink2)]',
                ].join(' ')
              }
              style={({ isActive }) =>
                isActive ? { background: 'var(--tf-ink)' } : {}
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="h-[15px] w-[15px] shrink-0" />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
