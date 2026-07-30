import { useState, useEffect } from 'react';
import bgFlag from '../../assets/backgrounds/bg-flag.webp';
import bgClassroom from '../../assets/backgrounds/bg-classroom.webp';
import bgClassroom2 from '../../assets/backgrounds/bg-classroom_2.webp';
import logo from '../../assets/logo/logo.webp';
import BackButton from '../common/BackButton.jsx';

const BACKGROUNDS = [bgFlag, bgClassroom, bgClassroom2];
let sharedIndex = 0;

export default function AuthLayout({ showBack = false, backTo = '/login', children }) {
  const [currentIndex, setCurrentIndex] = useState(sharedIndex);

  const setIndex = (val) => {
    const nextVal = typeof val === 'function' ? val(sharedIndex) : val;
    sharedIndex = nextVal;
    setCurrentIndex(nextVal);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % BACKGROUNDS.length);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen w-full flex bg-cream">
      {/* Background Slideshow Column */}
      <div className="hidden lg:block relative shrink-0 overflow-hidden" style={{ flexBasis: '55%' }}>
        {BACKGROUNDS.map((src, index) => (
          <img
            key={src}
            src={src}
            alt=""
            className={`absolute inset-0 size-full object-cover transition-opacity duration-1000 ease-in-out ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}

        {/* Slide Indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
          {BACKGROUNDS.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setIndex(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex ? 'w-6 bg-white shadow' : 'w-2 bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-between px-6 py-8 sm:px-16 sm:py-10">
        <div className="w-full flex items-center justify-between">
          {showBack ? <BackButton to={backTo} /> : <span className="hidden sm:block" />}
          <div className={`flex items-center gap-2 ${showBack ? '' : 'mx-auto'}`}>
            <img
              src={logo}
              alt=""
              className="h-[32px] sm:h-[40px] w-auto"
            />
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-ink font-sans translate-y-[5px]">
              SalinTinig
            </span>
          </div>
        </div>

        <div className="w-full flex flex-1 flex-col items-center justify-center">{children}</div>

        <p className="text-sm sm:text-base text-ink/50 text-center max-w-2xl">
          By signing in you accept the <span className="font-semibold">Terms of Service</span> and{' '}
          <span className="font-semibold">Privacy Policy</span>
        </p>
      </div>
    </div>
  );
}
