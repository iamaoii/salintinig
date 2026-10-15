import { Icon } from '@iconify/react';

const VARIANT = {
  default: 'bg-cream border-ink/10 text-ink shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)]',
  priority: 'bg-[#FDF2F0] border-brand-red/15 text-brand-red shadow-[0px_5px_5px_0px_rgba(213,63,36,0.08)]',
};

export default function StatCard({
  value,
  unit,
  label,
  iconName,
  iconBg,
  action,
  variant = 'default',
  compact = false,
  badge,
  badgeColor,
  scale,
  description,
  progressPct,
}) {
  return (
    <div className={`relative flex flex-col justify-between rounded-2xl border transition-all ${compact ? 'p-3.5' : 'p-4'} ${VARIANT[variant]}`}>
      <div>
        {/* Top Header: Stat Value + Icon */}
        <div className="flex w-full items-start justify-between gap-1">
          <div className="min-w-0">
            <p className={`flex items-baseline gap-1 font-extrabold leading-none tracking-tight ${compact ? 'text-2xl' : 'text-3xl'}`}>
              {value}
              {unit && <span className={`${compact ? 'text-sm' : 'text-base'} font-semibold text-ink/50`}>{unit}</span>}
            </p>
            <p className={`whitespace-pre-line font-bold uppercase tracking-wider text-ink/50 mt-1.5 ${compact ? 'text-[9.5px]' : 'text-[11px]'}`}>
              {label}
            </p>
          </div>
          {iconName && (
            <div className={`flex shrink-0 items-center justify-center rounded-xl ${compact ? 'size-8' : 'size-9'} ${iconBg}`}>
              <Icon icon={iconName} className={compact ? 'size-4' : 'size-5'} />
            </div>
          )}
          {action}
        </div>

        {/* Qualitative Status Badge */}
        {badge && (
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10.5px] font-bold ${badgeColor || 'bg-ink/5 text-ink/80 border-ink/10'}`}>
              <span className="size-1.5 rounded-full bg-current" />
              {badge}
            </span>
          </div>
        )}

        {/* Sleek Tri-Color Phil-IRI Status Bar */}
        {scale && scale.length > 0 && (
          <div className="mt-3 space-y-1.5">
            <div className="flex h-2 w-full gap-1 rounded-full bg-ink/[0.06] p-0.5">
              {scale.map((segment, idx) => (
                <div
                  key={idx}
                  className={`h-full flex-1 rounded-full transition-all duration-300 ${segment.color} ${
                    segment.active
                      ? 'shadow-xs ring-1.5 ring-ink/30 scale-y-110'
                      : 'opacity-35 hover:opacity-50'
                  }`}
                  title={`${segment.label}${segment.active ? ' (Current)' : ''}`}
                />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-1 px-0.5 text-[8.5px] font-medium leading-tight text-ink/60">
              {scale.map((segment, idx) => (
                <span
                  key={idx}
                  className={`whitespace-pre-line text-center transition-colors ${
                    segment.active ? 'font-bold text-ink drop-shadow-xs' : 'text-ink/50'
                  }`}
                >
                  {segment.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Smooth Single Progress Line (for completion progress) */}
        {progressPct !== undefined && !scale && (
          <div className="mt-3 space-y-1">
            <div className="h-2 w-full overflow-hidden rounded-full bg-ink/[0.06] p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-600 transition-all duration-500 shadow-xs"
                style={{ width: `${Math.min(Math.max(progressPct, 0), 100)}%` }}
              />
            </div>
            <div className="flex justify-end text-[9px] font-bold text-ink/60">
              <span>{Math.min(Math.max(progressPct, 0), 100)}% completed</span>
            </div>
          </div>
        )}
      </div>

      {/* Concise Pedagogical Interpretation Subtitle */}
      {description && (
        <div className="mt-2.5 pt-2 border-t border-ink/5">
          <p className="text-[11px] leading-snug text-ink/70 italic">
            {description}
          </p>
        </div>
      )}
    </div>
  );
}
