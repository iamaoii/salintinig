import { DotsThree } from '@phosphor-icons/react';
import logoBg from '../../../assets/logo/logo_bg.webp';

export default function ClassCard({ className: sectionName = 'Grade 4 - Fyang', day = 'FRIDAY', time = '7:30AM - 9:30AM' }) {
  return (
    <div className="relative flex items-start justify-between overflow-hidden rounded-2xl bg-brand-red p-5 text-cream shadow-[0px_5px_5px_0px_rgba(26,24,22,0.1)]">
      {/* Background Logo Watermark */}
      <img
        src={logoBg}
        alt=""
        className="pointer-events-none absolute right-0 top-0 h-full w-auto object-cover brightness-[3] mix-blend-screen"
      />

      <div className="relative z-10 flex flex-col items-start gap-2">
        <h2 className="text-3xl sm:text-[32px] font-bold leading-tight text-cream">{sectionName}</h2>
        <div className="flex flex-col gap-1 text-sm font-medium leading-tight text-cream/90">
          <p className="uppercase tracking-wide">{day}</p>
          <p>{time}</p>
        </div>
      </div>

      <button type="button" className="relative z-10 text-cream/90 transition-colors hover:text-cream" aria-label="Class options">
        <DotsThree size={32} weight="bold" />
      </button>
    </div>
  );
}
