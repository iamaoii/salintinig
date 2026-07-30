

import { Icon } from '@iconify/react';

const LEVELS = [
  { label: 'Frustration Level', color: '#d53f24', key: 'frustration' },
  { label: 'Instructional Level', color: '#ffc300', key: 'instructional' },
  { label: 'Independent Level', color: '#00a652', key: 'independent' },
];

function makeSliceD(cx, cy, R, r, startDeg, endDeg) {
  let diff = endDeg - startDeg;
  if (diff >= 360) diff = 359.99;
  const actualEnd = startDeg + diff;

  const a1 = ((startDeg - 90) * Math.PI) / 180;
  const a2 = ((actualEnd - 90) * Math.PI) / 180;

  const x1 = cx + R * Math.cos(a1);
  const y1 = cy + R * Math.sin(a1);
  const x2 = cx + R * Math.cos(a2);
  const y2 = cy + R * Math.sin(a2);

  const x3 = cx + r * Math.cos(a2);
  const y3 = cy + r * Math.sin(a2);
  const x4 = cx + r * Math.cos(a1);
  const y4 = cy + r * Math.sin(a1);

  const largeArc = diff > 180 ? 1 : 0;

  return `M ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${r} ${r} 0 ${largeArc} 0 ${x4} ${y4} Z`;
}

export default function ReadingLevelDonut({ counts }) {
  const total = (counts.frustration || 0) + (counts.instructional || 0) + (counts.independent || 0);

  let currentAngle = 0;
  const slices = LEVELS.map((level) => {
    const count = counts[level.key] || 0;
    const percent = total > 0 ? (count / total) * 100 : 0;
    const angle = total > 0 ? (count / total) * 360 : 0;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const midAngleDeg = startAngle + angle / 2;
    const midAngleRad = ((midAngleDeg - 90) * Math.PI) / 180;
    const textRadius = (75 + 38) / 2;
    const textX = 80 + textRadius * Math.cos(midAngleRad);
    const textY = 80 + textRadius * Math.sin(midAngleRad);

    return {
      ...level,
      count,
      percent: Math.round(percent),
      startAngle,
      endAngle,
      textX,
      textY,
    };
  });

  return (
    <div className="flex w-full flex-col items-start gap-4 rounded-xl border border-ink/10 bg-cream p-4 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)]">
      <div className="flex items-center gap-2.5">
        <Icon icon="ph:chart-pie-slice" className="size-5 text-ink/50" />
        <p className="text-sm font-semibold text-ink/60">Reading Level Classification</p>
      </div>

      <div className="flex w-full items-center justify-around gap-4 py-2">
        {/* Donut Chart SVG */}
        <div className="relative size-[160px] shrink-0">
          <svg viewBox="0 0 160 160" className="size-full">
            {total > 0 &&
              slices.map((slice) =>
                slice.percent > 0 ? (
                  <g key={slice.key}>
                    <path
                      d={makeSliceD(80, 80, 75, 38, slice.startAngle, slice.endAngle)}
                      fill={slice.color}
                      className="transition-opacity duration-200 hover:opacity-90"
                    />
                    <text
                      x={slice.textX}
                      y={slice.textY}
                      fill="#FFFFFF"
                      fontSize="11"
                      fontWeight="700"
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      {slice.percent}%
                    </text>
                  </g>
                ) : null
              )}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex shrink-0 flex-col gap-2.5">
          {slices.map((slice) => (
            <div key={slice.key} className="flex items-center gap-3">
              <span className="h-7 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
              <span className="w-4 text-base font-bold text-ink">{slice.count}</span>
              <span className="text-xs font-semibold leading-tight text-ink/80">
                {slice.label.split(' ')[0]}
                <br />
                Level
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
