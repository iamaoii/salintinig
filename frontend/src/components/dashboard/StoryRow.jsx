import { BookOpenText } from '@phosphor-icons/react';

const COVER_COLOR = {
  blue: 'from-[#3b82f6] to-[#165fd5]',
  red: 'from-[#f0674a] to-[#d53f24]',
  yellow: 'from-[#ffdd66] to-[#ffc300]',
  green: 'from-[#4ade80] to-[#00a652]',
};

export default function StoryRow({ story }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`flex aspect-[3/4] w-full items-center justify-center rounded-2xl bg-gradient-to-b p-4 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.15)] ${COVER_COLOR[story.color]}`}
      >
        <BookOpenText size={40} weight="fill" className="text-cream/90" />
      </div>
      <p className="text-center text-sm font-medium leading-tight text-ink">{story.title}</p>
    </div>
  );
}
