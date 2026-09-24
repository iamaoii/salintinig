import React from 'react';
import logo from '../../assets/logo/logo.webp';

// 4 Signature rich theme colors matching Picture 1 (Green, Amber/Gold, Crimson Red, Royal Blue)
const PRESET_THEMES = [
  {
    primary: '#008744',
    dark: '#005f30',
    titleColor: '#008744',
  },
  {
    primary: '#f4b400',
    dark: '#c48e00',
    titleColor: '#c48e00',
  },
  {
    primary: '#d83b27',
    dark: '#9e2213',
    titleColor: '#9e2213',
  },
  {
    primary: '#1565c0',
    dark: '#0d47a1',
    titleColor: '#1565c0',
  },
];

export function getStoryTheme(story, fallbackIndex = 0) {
  const title = (story?.title || story?.id || '').toString();
  if (!title) {
    return PRESET_THEMES[fallbackIndex % PRESET_THEMES.length];
  }

  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash * 37 + title.charCodeAt(i)) & 0xffffffff;
  }
  return PRESET_THEMES[Math.abs(hash) % PRESET_THEMES.length];
}

export default function StoryBookCover({
  story,
  index = 0,
  className = '',
  aspectRatio = '1 / 1.45',
  onClick,
}) {
  const theme = getStoryTheme(story, index);
  const title = story?.title || 'Walang Pamagat';
  const author = story?.author || 'Juan dela Cruz';

  return (
    <div
      onClick={onClick}
      style={{ aspectRatio }}
      className={`relative w-full flex flex-col select-none drop-shadow-md transition-transform duration-200 hover:-translate-y-1 ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {/* 1. TOP COVER BOARD (Hardcover book face + spine) */}
      <div className="relative flex-1 w-full bg-[#1A1816] rounded-t-[10px] rounded-br-[2px] p-[2.4px] pb-0 flex flex-col overflow-hidden">
        <div
          className="relative flex-1 w-full rounded-t-[8px] overflow-hidden"
          style={{ backgroundColor: theme.primary }}
        >
          {/* Subtle Organic Background Circles */}
          <div
            className="absolute -top-[15%] -right-[20%] w-[90%] aspect-square rounded-full pointer-events-none"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.14)' }}
          />
          <div
            className="absolute top-[22%] -right-[15%] w-[65%] aspect-square rounded-full pointer-events-none"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.08)' }}
          />

          {/* Left Vertical Dark Spine Section: exactly 13.5% width, identical stroke and radius */}
          <div
            className="absolute left-0 top-0 bottom-0 w-[13.5%] rounded-tl-[8px] z-10"
            style={{ backgroundColor: theme.dark }}
          />

          {/* Spine Groove Shadow (inner 3D depth to match mobile) */}
          <div
            className="absolute left-[13.5%] top-0 bottom-0 w-[4px] pointer-events-none z-10"
            style={{
              background: 'linear-gradient(to right, rgba(0, 0, 0, 0.32), transparent)',
            }}
          />

          {/* One continuous foreground edge between the spine and cover face. */}
          <div className="pointer-events-none absolute left-[calc(13.5%-2.4px)] top-0 bottom-0 z-30 w-[2.4px] bg-[#1A1816]" />

          {/* Center White Wrap-around Belly Band for Title & Author */}
          {/* Centered vertically in the cover; height stays at 28%. */}
          <div
            className="absolute left-0 right-0 top-[36%] h-[28%] bg-white border-y-[2.4px] border-[#1A1816] z-20 shadow-[0_1.5px_3px_rgba(0,0,0,0.12)]"
          >
            {/* Left tint extension over the spine */}
            <div
              className="absolute left-0 top-0 bottom-0 w-[13.5%]"
              style={{
                backgroundColor: theme.dark,
                opacity: 0.26,
              }}
            />

            {/* Title & Author text container: padded exactly to clear spine (13.5% + offset) */}
            <div
              className="absolute inset-0 flex flex-col justify-center min-w-0"
              style={{
                paddingLeft: 'calc(13.5% + 7px)',
                paddingRight: '6px',
                paddingTop: '2px',
                paddingBottom: '2px',
              }}
            >
              <h4
                className="font-serif font-black tracking-[-0.3px] line-clamp-2"
                style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontWeight: 900,
                  color: theme.titleColor,
                  fontSize: 'clamp(9.5px, 2.5vw, 13px)',
                  lineHeight: 1.1,
                }}
                title={title}
              >
                {title}
              </h4>
              <p
                className="italic font-semibold truncate mt-[2px]"
                style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontStyle: 'italic',
                  fontWeight: 600,
                  fontSize: 'clamp(7px, 1.8vw, 8.5px)',
                  color: 'rgba(26, 24, 22, 0.82)',
                  lineHeight: 1.15,
                }}
              >
                by {author}
              </p>
            </div>
          </div>

          {/* Bottom-Right Branding: SalinTinig Logo & Text */}
          <div className="absolute bottom-[5%] right-[6%] z-20 flex items-center gap-1 opacity-95">
            <img
              src={logo}
              alt="SalinTinig"
              className="w-3 h-3 sm:w-3.5 sm:h-3.5 object-contain brightness-0 invert"
            />
            <span
              className="font-sans font-black text-white tracking-wide"
              style={{
                fontSize: 'clamp(7.5px, 1.9vw, 9.5px)',
              }}
            >
              SalinTinig
            </span>
          </div>
        </div>
      </div>

      {/* 2. BOTTOM PAGES SECTION (Matching rounded-left capsule with 2-tone paper texture) */}
      <div className="relative h-[11.5px] w-full">
        {/* Pages capsule with rounded left and dark stroke */}
        <div className="absolute inset-0 bg-[#DCDFE4] rounded-l-full rounded-r-[2px] border-[2.4px] border-[#1A1816] overflow-hidden flex flex-col">
          {/* Top lighter highlight (55% / flex 5) */}
          <div className="h-[55%] w-full bg-[#EEEEF0]" />
          {/* Bottom shaded page edge (45% / flex 4) */}
          <div className="h-[45%] w-full bg-[#BCC2CA]" />
        </div>

        {/* Left Spine Overhang Connector */}
        <div
          className="absolute left-0 -top-[2.4px] w-[2.4px] h-[5.5px] bg-[#1A1816]"
        />
      </div>
    </div>
  );
}
