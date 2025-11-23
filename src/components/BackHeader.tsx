// src/components/BackHeader.tsx
import { Link } from 'react-router-dom';

type Props = {
  title: string;
  showHome?: boolean;
  titleClassName?: string;
};

export default function BackHeader({ title, showHome = true, titleClassName }: Props) {
  return (
    <div className="mb-6 flex items-center gap-3">
      {showHome && (
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#101216] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:bg-[#151821]"
        >
          <span>🏠</span>
          <span>Home</span>
        </Link>
      )}
      <h2 className={[
        'text-3xl font-extrabold tracking-tight text-indigo-400',
        titleClassName || ''
      ].join(' ')}>
        {title}
      </h2>
    </div>
  );
}
