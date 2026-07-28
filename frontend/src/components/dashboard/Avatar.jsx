const COLORS = ['#165fd5', '#d53f24', '#0f9d58', '#c2790a', '#7c3aed', '#0891b2'];

function colorFor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

function initialsFor(name) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[parts.length - 1]?.[0] || '')).toUpperCase();
}

export default function Avatar({ name, size = 32, className = '' }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-medium text-cream ${className}`}
      style={{ width: size, height: size, backgroundColor: colorFor(name), fontSize: size * 0.4 }}
    >
      {initialsFor(name)}
    </div>
  );
}
