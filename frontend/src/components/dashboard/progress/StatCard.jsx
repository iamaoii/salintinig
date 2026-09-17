import { Icon } from '@iconify/react';

const VARIANT = {
  default: 'bg-cream border-ink/10 text-ink shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)]',
  priority: 'bg-[#FDF2F0] border-brand-red/15 text-brand-red shadow-[0px_5px_5px_0px_rgba(213,63,36,0.08)]',
};

export default function StatCard({ value, unit, label, iconName, iconBg, action, variant = 'default' }) {
  return (
    <div className={`relative flex flex-col justify-between rounded-2xl border p-4 ${VARIANT[variant]}`}>
      <div className="flex w-full items-center justify-between gap-1">
        <p className="flex items-baseline gap-1 text-3xl font-extrabold leading-none tracking-tight">
          {value}
          {unit && <span className="text-base font-semibold text-ink/50">{unit}</span>}
        </p>
        {action}
      </div>

      <div className="mt-5 flex items-end justify-between gap-2">
        <p className="whitespace-pre-line text-xs font-semibold leading-tight text-ink/80">{label}</p>
        {iconName && (
          <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
            <Icon icon={iconName} className="size-6" />
          </div>
        )}
      </div>
    </div>
  );
}
