const VARIANT = {
  default: 'bg-cream border-ink/10 text-ink',
  priority: 'bg-brand-red/10 border-brand-red/10 text-brand-red shadow-[0px_5px_5px_0px_rgba(213,63,36,0.1)]',
};

export default function StatCard({ value, unit, label, icon, variant = 'default', action }) {
  return (
    <div className={`relative flex flex-col gap-2 rounded-[10px] border p-3 ${VARIANT[variant]}`}>
      <div className="flex w-full items-center justify-between">
        <p className="flex items-baseline gap-0.5 text-2xl font-medium leading-none">
          {value}
          {unit && <span className="text-sm font-medium text-ink/50">{unit}</span>}
        </p>
        {action}
      </div>
      <p className="whitespace-pre-line pr-8 text-[11px] font-medium leading-tight">{label}</p>
      {icon && <img src={icon} alt="" className="absolute bottom-3 right-3 size-7 shrink-0" />}
    </div>
  );
}
