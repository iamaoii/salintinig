const WIDTH = 480;
const HEIGHT = 260;
const PADDING_LEFT = 32;
const PADDING = 24;

function toPoints(values) {
  const max = 100;
  const stepX = (WIDTH - PADDING_LEFT - PADDING) / (values.length - 1);
  return values.map((v, i) => {
    const x = PADDING_LEFT + i * stepX;
    const y = PADDING + (1 - v / max) * (HEIGHT - PADDING * 2);
    return [x, y];
  });
}

function toPath(points) {
  return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
}

const Y_TICKS = [0, 25, 50, 75, 100];

export default function AccuracyTrendChart({ sessions = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'], accuracy = [], comprehension = [] }) {
  const chartSessions = sessions && sessions.length > 0 ? sessions : ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'];
  const hasData = accuracy && accuracy.length > 0;
  const accuracyPoints = hasData ? toPoints(accuracy) : [];
  const comprehensionPoints = (comprehension && comprehension.length > 0) ? toPoints(comprehension) : [];
  const stepX = (WIDTH - PADDING_LEFT - PADDING) / (chartSessions.length - 1);

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" preserveAspectRatio="none">
        <rect
          x={PADDING_LEFT}
          y={PADDING}
          width={WIDTH - PADDING_LEFT - PADDING}
          height={HEIGHT - PADDING * 2}
          fill="none"
          stroke="rgba(26,24,22,0.1)"
          strokeWidth={1}
        />

        {Y_TICKS.map((v) => {
          const y = PADDING + (1 - v / 100) * (HEIGHT - PADDING * 2);
          return (
            <g key={v}>
              <line x1={PADDING_LEFT} y1={y} x2={WIDTH - PADDING} y2={y} stroke="rgba(26,24,22,0.08)" strokeWidth={1} />
              <text x={PADDING_LEFT - 8} y={y} fontSize={9} textAnchor="end" dominantBaseline="middle" fill="rgba(26,24,22,0.5)">
                {v}
              </text>
            </g>
          );
        })}

        {chartSessions.map((_, i) => {
          const x = PADDING_LEFT + i * stepX;
          return (
            <line key={i} x1={x} y1={PADDING} x2={x} y2={HEIGHT - PADDING} stroke="rgba(26,24,22,0.08)" strokeWidth={1} />
          );
        })}

        {accuracyPoints.length > 0 && (
          <path d={toPath(accuracyPoints)} fill="none" stroke="#165fd5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        )}
        {comprehensionPoints.length > 0 && (
          <path d={toPath(comprehensionPoints)} fill="none" stroke="#d53f24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        )}

        {accuracyPoints.map(([x, y], i) => (
          <circle key={`a-${i}`} cx={x} cy={y} r={3} fill="#165fd5" />
        ))}
        {comprehensionPoints.map(([x, y], i) => (
          <circle key={`c-${i}`} cx={x} cy={y} r={3} fill="#d53f24" />
        ))}

        {chartSessions.map((label, i) => (
          <text key={label} x={PADDING_LEFT + i * stepX} y={HEIGHT - 4} fontSize={9} textAnchor="middle" fill="rgba(26,24,22,0.5)">
            {label}
          </text>
        ))}
      </svg>

      <div className="mt-2 flex items-center gap-4 text-xs text-ink/60">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-brand-blue" /> Accuracy
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-brand-red" /> Comprehension
        </span>
      </div>
    </div>
  );
}
