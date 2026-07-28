import watermark from '../../assets/card-watermark.svg';
import menuIcon from '../../assets/card-menu-icon.svg';

export default function ClassCard({ className: sectionName = 'Grade 4 - Fyang', day = 'FRIDAY', time = '7:30AM - 9:30AM' }) {
  return (
    <div className="relative flex items-start justify-between overflow-hidden rounded-[10px] border border-ink/5 bg-brand-red p-4 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.1)]">
      <img
        src={watermark}
        alt=""
        className="pointer-events-none absolute -right-8 -top-[52px] h-[250px] w-[210px]"
      />

      <div className="relative flex flex-col items-start gap-2">
        <h2 className="text-[32px] font-bold leading-[32px] text-cream">{sectionName}</h2>
        <div className="flex flex-col gap-2 text-base leading-4 text-cream">
          <p>{day}</p>
          <p>{time}</p>
        </div>
      </div>

      <button type="button" className="relative shrink-0 text-cream/70 hover:text-cream" aria-label="Class options">
        <img src={menuIcon} alt="" className="h-[3px] w-5" />
      </button>
    </div>
  );
}
