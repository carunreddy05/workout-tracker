// src/components/Layout.tsx
import React from 'react';
import Header from './Header';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Header />
      <main className="p-4 max-w-5xl mx-auto">{children}</main>
    </div>
  );
}
