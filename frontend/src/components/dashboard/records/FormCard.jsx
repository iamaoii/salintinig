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

export default function FormCard({ form }) {
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
      className="flex w-full items-center gap-4 rounded-2xl border border-ink/5 bg-cream p-4 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.08)] sm:gap-5 sm:px-6 sm:py-5 cursor-pointer hover:border-ink/20 hover:shadow-md transition-all"
    >
      <div className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${COLOR_STYLE[form.color]}`}>
        <Icon icon={iconName} className="size-[30px]" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
        <p className="text-base font-bold text-ink">{form.title}</p>
        <span className="rounded-full bg-ink/10 px-3 py-0.5 text-xs font-medium text-ink/70">
          {form.form}
        </span>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleClick();
        }}
        className="shrink-0 rounded-full bg-brand-blue px-5 py-2 text-sm font-semibold text-cream transition-colors hover:bg-blue-700 cursor-pointer"
      >
        View
      </button>
    </div>
  );
}
