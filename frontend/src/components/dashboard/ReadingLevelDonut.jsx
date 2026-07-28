import segment1 from '../../assets/sd-donut-segment-1.svg';
import segment2 from '../../assets/sd-donut-segment-2.svg';
import segment3 from '../../assets/sd-donut-segment-3.svg';
import readingLevelIcon from '../../assets/sd-icon-readinglevel-header.svg';

const LEVELS = [
  { label: 'Frustration Level', color: '#d53f24', key: 'frustration' },
  { label: 'Instructional Level', color: '#ffc300', key: 'instructional' },
  { label: 'Independent Level', color: '#00a652', key: 'independent' },
];

export default function ReadingLevelDonut({ counts }) {
  return (
    <div className="flex w-full flex-col items-start gap-4 rounded-[10px] border border-ink/10 bg-cream p-4">
      <div className="flex items-center gap-4">
        <img src={readingLevelIcon} alt="" className="size-5" />
        <p className="text-sm font-medium text-ink/50">Reading Level Classification</p>
      </div>

      <div className="flex w-full items-center justify-center gap-8 py-4">
        <div className="relative size-[160px] shrink-0">
          <div className="absolute inset-0">
            <div className="absolute inset-y-0 left-1/2 right-0">
              <img src={segment1} alt="" className="block size-full max-w-none" />
            </div>
          </div>
          <div className="absolute inset-0">
            <div className="absolute bottom-0 left-0 right-1/2 top-[34.55%]">
              <img src={segment2} alt="" className="block size-full max-w-none" />
            </div>
          </div>
          <div className="absolute inset-0">
            <div className="absolute inset-[0_49.99%_57.73%_2.45%]">
              <img src={segment3} alt="" className="block size-full max-w-none" />
            </div>
          </div>
          <p className="absolute left-[35.5px] top-[27px] text-[10px] font-medium leading-[10px] text-cream">20%</p>
          <p className="absolute left-[21.5px] top-[107px] text-[10px] font-medium leading-[10px] text-cream">30%</p>
          <p className="absolute left-[129.5px] top-[75px] text-[10px] font-medium leading-[10px] text-cream">50%</p>
        </div>

        <div className="flex w-[106px] shrink-0 flex-col items-start gap-2">
          {LEVELS.map((level) => (
            <div key={level.key} className="flex items-start gap-2">
              <span className="w-[5px] self-stretch shrink-0 rounded-[10px]" style={{ backgroundColor: level.color }} />
              <div className="flex items-center gap-2 py-1 text-ink">
                <p className="w-6 text-base leading-4">{counts[level.key]}</p>
                <div className="text-[10px] leading-[10px] whitespace-nowrap">
                  <p>{level.label.split(' ')[0]}</p>
                  <p>Level</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
