import { Icon } from '@iconify/react';

const VARIANT = {
  default: 'bg-cream border-ink/10 text-ink shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)]',
  priority: 'bg-[#FDF2F0] border-brand-red/15 text-brand-red shadow-[0px_5px_5px_0px_rgba(213,63,36,0.08)]',
};

export default function StatCard({ value, unit, label, iconName, iconBg, action, variant = 'default', compact = false }) {
  return (
    <div className={`relative flex flex-col justify-between rounded-2xl border ${compact ? 'p-3' : 'p-4'} ${VARIANT[variant]}`}>
      <div className="flex w-full items-center justify-between gap-1">
        <p className={`flex items-baseline gap-1 font-extrabold leading-none tracking-tight ${compact ? 'text-2xl' : 'text-3xl'}`}>
          {value}
          {unit && <span className={`${compact ? 'text-sm' : 'text-base'} font-semibold text-ink/50`}>{unit}</span>}
        </p>
        {action}
      </div>

      <div className={`${compact ? 'mt-3' : 'mt-5'} flex items-end justify-between gap-2`}>
        <p className={`whitespace-pre-line font-semibold leading-tight text-ink/80 ${compact ? 'text-[11px]' : 'text-xs'}`}>{label}</p>
        {iconName && (
          <div className={`flex shrink-0 items-center justify-center rounded-xl ${compact ? 'size-9' : 'size-10'} ${iconBg}`}>
            <Icon icon={iconName} className={compact ? 'size-5' : 'size-6'} />
          </div>
        )}
      </div>
    </div>
  );
}
