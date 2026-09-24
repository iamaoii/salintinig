export default function BadgeCard({ badge }) {
  if (!badge || badge.placeholder || !badge.image) {
    return null;
  }

  const badgeName = badge.name || 'Achievement Badge';
  const badgeDesc = badge.description || 'Awarded for completing reading tasks and milestones.';

  return (
    <div className="group flex flex-col items-center rounded-2xl border border-ink/10 bg-white p-3.5 shadow-2xs transition-all hover:-translate-y-1 hover:border-ink/20 hover:shadow-sm">
      {/* Badge Image: unclipped so entire rounded border and corners are intact */}
      <div className="w-full flex items-center justify-center p-1">
        <img
          src={badge.image}
          alt={badgeName}
          className="w-full h-auto object-contain drop-shadow-[0px_4px_10px_rgba(26,24,22,0.12)] transition-transform duration-200 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      {/* Details Underneath */}
      <div className="mt-3 flex w-full flex-col items-center text-center">
        <p className="text-xs font-bold text-ink leading-tight line-clamp-1">
          {badgeName}
        </p>
        <p className="mt-1 text-[11px] font-medium text-ink/60 leading-snug line-clamp-2">
          {badgeDesc}
        </p>
      </div>
    </div>
  );
}
