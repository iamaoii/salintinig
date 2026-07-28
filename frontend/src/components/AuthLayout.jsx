import bgFlag from '../assets/bg-flag.png';
import bgClassroom from '../assets/bg-classroom.png';
import logo from '../assets/logo-salintinig.png';
import BackButton from './BackButton.jsx';

const PHOTOS = {
  flag: { src: bgFlag, basis: '58.6%' },
  classroom: { src: bgClassroom, basis: '36.6%' },
};

export default function AuthLayout({ photo = 'flag', showBack = false, backTo = '/login', children }) {
  const { src: photoSrc, basis: photoBasis } = PHOTOS[photo];

  return (
    <div className="min-h-screen w-full flex bg-cream">
      <div className="hidden lg:block relative shrink-0" style={{ flexBasis: photoBasis }}>
        <img src={photoSrc} alt="" className="absolute inset-0 size-full object-cover" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-between px-6 py-8 sm:px-16 sm:py-10">
        <div className="w-full flex items-center justify-between">
          {showBack ? <BackButton to={backTo} /> : <span className="hidden sm:block" />}
          <img
            src={logo}
            alt="SalinTinig"
            className={`h-[38px] sm:h-[50px] w-auto ${showBack ? '' : 'mx-auto'}`}
          />
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
