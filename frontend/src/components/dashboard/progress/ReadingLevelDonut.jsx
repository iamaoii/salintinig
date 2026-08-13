import { useState, useMemo, useEffect } from 'react';
import { Icon } from '@iconify/react';

const LEVELS = [
  { label: 'Frustration Level', key: 'frustration', color: '#d53f24' },
  { label: 'Instructional Level', key: 'instructional', color: '#ffc300' },
  { label: 'Independent Level', key: 'independent', color: '#00a652' },
];

export default function ReadingLevelDonut({ counts = {} }) {
  const [hoveredSlice, setHoveredSlice] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const total = (counts.frustration || 0) + (counts.instructional || 0) + (counts.independent || 0);

  const slices = useMemo(() => {
    const safeTotal = total || 1;
    let cumulativePercent = 0;

    return LEVELS.map((lvl) => {
      const count = counts[lvl.key] || 0;
      const percent = total > 0 ? (count / safeTotal) * 100 : 0;
      const startAngle = cumulativePercent * 3.6;
      cumulativePercent += percent;
      const endAngle = cumulativePercent * 3.6;

      const x1 = 50 + 40 * Math.cos(((startAngle - 90) * Math.PI) / 180);
      const y1 = 50 + 40 * Math.sin(((startAngle - 90) * Math.PI) / 180);
      const x2 = 50 + 40 * Math.cos(((endAngle - 90) * Math.PI) / 180);
      const y2 = 50 + 40 * Math.sin(((endAngle - 90) * Math.PI) / 180);

      const largeArc = percent > 50 ? 1 : 0;
      const pathData =
        percent >= 99.99
          ? `M 50,10 A 40,40 0 1,1 49.99,10 Z`
          : `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;

      return {
        ...lvl,
        count,
        percent: Math.round(percent),
        pathData,
      };
    });
  }, [counts, total]);

  return (
    <div className="flex w-full flex-col items-start gap-4 rounded-2xl border border-ink/10 bg-cream p-5 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)] overflow-hidden">
      {/* Header Title */}
      <div className="flex items-center gap-2.5">
        <Icon icon="ph:chart-pie-slice-bold" className="size-5 text-brand-red" />
        <p className="text-sm font-bold text-ink">Reading Level Classification</p>
      </div>

      {/* Chart & Legend Layout */}
      <div className="flex w-full flex-col items-center justify-between gap-5 sm:flex-row min-w-0">
        {/* SVG Donut Chart with Dynamic Slice Scale & Load Animations */}
        <div className="relative size-36 shrink-0">
          <svg
            viewBox="0 0 100 100"
            className={`size-full transition-all duration-700 ease-out ${
              isMounted
                ? 'rotate-[-90deg] scale-100 opacity-100'
                : 'rotate-[-270deg] scale-75 opacity-0'
            }`}
          >
            {total === 0 ? (
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="#E2E8F0"
                className="transition-opacity duration-300"
              />
            ) : (
              slices.map((slice, i) => {
                if (slice.percent <= 0) return null;
                const isHovered = hoveredSlice === i;
                const isAnyHovered = hoveredSlice !== null;
                const opacityStyle = isAnyHovered && !isHovered ? 0.35 : 1;
                const scaleTransform = isHovered ? 'scale(1.05)' : 'scale(1)';

                return (
                  <path
                    key={slice.key}
                    d={slice.pathData}
                    fill={slice.color}
                    style={{
                      opacity: opacityStyle,
                      transform: scaleTransform,
                      transformOrigin: '50px 50px',
                      transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease',
                    }}
                    onMouseEnter={() => setHoveredSlice(i)}
                    onMouseLeave={() => setHoveredSlice(null)}
                    className="cursor-pointer"
                  />
                );
              })
            )}
            {/* Donut Inner Hole */}
            <circle cx="50" cy="50" r="27" fill="#FFFDF8" />
          </svg>

          {/* Animated Center Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none transition-all duration-300 px-2">
            {hoveredSlice !== null && total > 0 ? (
              <>
                <span
                  className="text-xl font-extrabold leading-none animate-fade-in"
                  style={{ color: slices[hoveredSlice].color }}
                >
                  {slices[hoveredSlice].count}
                </span>
                <span className="text-[9px] font-bold text-ink/80 leading-tight mt-0.5">
                  {slices[hoveredSlice].label.split(' ')[0]}
                </span>
                <span className="text-[8px] font-semibold text-ink/50 leading-none mt-0.5">
                  ({slices[hoveredSlice].percent}%)
                </span>
              </>
            ) : (
              <>
                <span className="text-2xl font-extrabold text-ink leading-none">{total}</span>
                <span className="text-[9px] font-bold text-ink/50 uppercase tracking-wider mt-0.5">Learners</span>
              </>
            )}
          </div>
        </div>

        {/* Legend with Contained Border Highlighting */}
        <div className="flex flex-1 flex-col gap-2 min-w-0 w-full">
          {slices.map((slice, i) => {
            const isHovered = hoveredSlice === i;
            return (
              <div
                key={slice.key}
                onMouseEnter={() => setHoveredSlice(i)}
                onMouseLeave={() => setHoveredSlice(null)}
                className={`flex items-center justify-between rounded-xl border px-3 py-2 transition-colors cursor-pointer ${
                  isHovered
                    ? 'border-ink/25 bg-white shadow-xs'
                    : 'border-ink/10 bg-white/70 hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="h-5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
                  <span className="text-xs font-bold text-ink truncate">{slice.label}</span>
                </div>
                <div className="flex items-center gap-1 text-xs font-extrabold text-ink shrink-0 ml-2">
                  <span>{slice.count}</span>
                  <span className="text-[10px] font-semibold text-ink/40">({slice.percent}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
