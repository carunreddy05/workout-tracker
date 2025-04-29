// src/components/BackHeader.tsx
import { Link } from 'react-router-dom';

export default function BackHeader({ title }: { title: string }) {
  return (
    <div className="mb-6 flex items-center gap-4">
      <Link
        to="/"
        className="text-sm px-3 py-1 bg-zinc-700 hover:bg-zinc-600 text-white rounded shadow"
      >
        🏠 Home
      </Link>
      <h2 className="text-2xl font-bold text-indigo-400">{title}</h2>
    </div>
  );
}
