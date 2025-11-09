import React from 'react';

interface Props {
  title: string;
  value: string | number;
  layout?: 'square' | 'band';
}

export default function KpiCard({ title, value, layout = 'square' }: Props) {
  const neonGreen = '#00ff00';
  const glowColor = 'rgba(0,255,0,0.18)';
  const neonColor = 'rgba(0,255,0,0.95)';
  
  if (layout === 'band') {
    return (
      <div className="relative rounded-[18px] p-3 sm:p-4 bg-zinc-900/80 border-[#00ff00] border overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-[rgba(0,255,0,0.06)] via-transparent to-transparent" />
        <div className="relative flex items-center gap-3">
          <div className="flex-1">
            <div className="text-zinc-300 text-base md:text-sm">{title}</div>
            <div className="text-[#00ff00] text-2xl sm:text-3xl md:text-4xl font-extrabold">{value}</div>
          </div>
        </div>
      </div>
    );
  }

  // square layout: compact rounded square with title at top and large value centered
  if (layout === 'square') {
    return (
      <div
        className="relative bg-black/90 border-[#00ff00] ring-0 border-2 rounded-[24px] overflow-hidden p-2 sm:p-3 w-full min-w-[120px] aspect-square flex items-stretch"
        style={{ 
          boxShadow: '0 0 30px rgba(0,255,0,0.3), inset 0 0 10px rgba(0,255,0,0.1)',
          minHeight: '120px'
        }}
      >
        <div className="absolute inset-0 pointer-events-none z-0 bg-gradient-to-br from-[rgba(0,255,0,0.1)] via-transparent to-transparent" />

        <div className="relative w-full h-full flex flex-col justify-between z-20 py-3">
          {/* title: centered at top */}
          <div className="text-zinc-100 text-sm sm:text-base font-semibold leading-snug text-center">
            <span className="z-20 block break-words">{title}</span>
          </div>
          
          {/* centered big value taking most of the space */}
          <div className="flex-1 flex items-center justify-center -mt-2">
            <div
              className="text-[#00ff00] font-extrabold text-[28px] sm:text-[40px] md:text-[52px] text-center"
              style={{ textShadow: '0 0 20px rgba(0,255,0,0.6)' }}
              >
                {value}
              </div>
            </div>
        </div>
      </div>
    );
  }

  // default (compact inline card)
  return (
    <div className="relative rounded-2xl p-5 bg-black/90 border border-[#00ff00] overflow-hidden">
      {/* subtle neon glow background */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-[rgba(0,255,0,0.1)] via-transparent to-transparent" />
      <div className="relative flex items-start gap-4">
        <div>
          <div className="text-zinc-300 text-sm">{title}</div>
          <div className="text-[#00ff00] text-3xl md:text-4xl font-extrabold" 
               style={{ textShadow: '0 0 15px rgba(0,255,0,0.6)' }}>{value}</div>
        </div>
      </div>
    </div>
  );
}

