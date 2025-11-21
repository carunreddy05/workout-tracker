// src/components/TrackfitMark.tsx
import React from 'react';

export default function TrackfitMark({ size = 48 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-[0_0_12px_rgba(52,211,153,0.45)]"
    >
      <defs>
        <linearGradient id="markGradient" x1="16" y1="6" x2="50" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#34d399" />
          <stop offset="1" stopColor="#4ade80" />
        </linearGradient>
      </defs>
      <path
        d="M36.8 6.4L14 32h13.6L27.2 57.6 50 32H36.4l0.4-25.6Z"
        fill="url(#markGradient)"
        stroke="#86efac"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="18" cy="14" r="5" fill="#10b981" opacity="0.3" />
      <circle cx="46" cy="50" r="4" fill="#bbf7d0" opacity="0.2" />
    </svg>
  );
}
