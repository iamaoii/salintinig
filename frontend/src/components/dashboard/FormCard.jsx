import { Users, Microphone, Book, User } from '@phosphor-icons/react';

const ICONS = { users: Users, microphone: Microphone, book: Book, user: User };

const COLOR_STYLE = {
  amber: 'bg-amber-100 text-amber-600',
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
};

export default function FormCard({ form }) {
  const Icon = ICONS[form.icon];

  return (
    <div className="flex items-center gap-4 rounded-xl border border-ink/5 bg-cream p-4 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.1)]">
      <div className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${COLOR_STYLE[form.color]}`}>
        <Icon size={24} weight="fill" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{form.title}</p>
        <p className="text-xs text-ink/50">{form.form}</p>
      </div>
      <button
        type="button"
        className="shrink-0 rounded-full bg-brand-blue px-5 py-2 text-sm font-medium text-cream transition-colors hover:bg-blue-700"
      >
        View
      </button>
    </div>
  );
}
