import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';

const ICONS = {
  usersThree: 'ph:users-three',
  userSound: 'ph:user-sound',
  article: 'ph:article',
  user: 'ph:user',
};

const COLOR_STYLE = {
  amber: 'bg-[#FEF08A] text-[#CA8A04]',
  blue:  'bg-[#DBEAFE] text-[#2563EB]',
  green: 'bg-[#D1FAE5] text-[#059669]',
};

export default function FormCard({ form, className = '' }) {
  const navigate = useNavigate();
  const iconName = ICONS[form.icon] || 'ph:file';

  const handleClick = () => {
    if (form.path) {
      navigate(form.path);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`flex w-full items-center justify-between gap-4 rounded-2xl border border-ink/5 bg-cream p-4 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.08)] sm:p-5 cursor-pointer hover:border-ink/20 hover:shadow-md transition-all ${className}`}
    >
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${COLOR_STYLE[form.color]}`}>
          <Icon icon={iconName} className="size-6" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-bold text-ink">{form.title}</p>
            <span className="rounded-md bg-ink/10 px-2 py-0.5 text-[11px] font-semibold text-ink/70">
              {form.form}
            </span>
          </div>
          {form.description && (
            <p className="text-xs text-ink/60 leading-relaxed truncate sm:whitespace-normal">{form.description}</p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleClick();
        }}
        className="shrink-0 rounded-full bg-brand-blue px-5 py-2 text-xs font-semibold text-cream transition-colors hover:bg-blue-700 cursor-pointer"
      >
        View
      </button>
    </div>
  );
}
