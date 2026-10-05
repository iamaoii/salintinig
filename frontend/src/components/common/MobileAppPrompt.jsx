import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import logo from '../../assets/logo/logo.webp';
import { mobileAppConfig } from '../../config/mobileApp';

export default function MobileAppPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Don't show on the download page itself
    if (location.pathname.startsWith('/download') || location.pathname.startsWith('/mobile')) {
      setIsVisible(false);
      return;
    }

    // Check if user previously chose "Stay on web" during this session
    const isDismissed = sessionStorage.getItem('salintinig_dismissed_mobile_prompt');
    if (isDismissed) {
      setIsVisible(false);
      return;
    }

    // Check if accessing from a mobile device or narrow screen
    const userAgent = typeof window !== 'undefined' ? (window.navigator.userAgent || '') : '';
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 768;

    if (isMobileDevice || isSmallScreen) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [location.pathname]);

  const handleStayOnWeb = () => {
    sessionStorage.setItem('salintinig_dismissed_mobile_prompt', 'true');
    setIsVisible(false);
  };

  const handleOpenApp = () => {
    // Navigate to download page or direct download
    if (typeof window !== 'undefined' && window.location.hostname.includes('policies.')) {
      window.location.href = `https://salintinig.org/download`;
    } else {
      navigate('/download');
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6 animate-in slide-in-from-bottom duration-300 pointer-events-auto">
      <div className="mx-auto max-w-lg bg-white rounded-3xl border border-[#dadce0] p-5 shadow-[0_-10px_35px_rgba(0,0,0,0.15)] flex flex-col gap-4">
        
        {/* Drag handle pill indicator */}
        <div className="w-10 h-1 bg-[#dadce0] rounded-full mx-auto" />

        {/* Content Row: Icon + Copy */}
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-2xl bg-[#1a73e8] p-2.5 shadow-sm flex items-center justify-center shrink-0">
            <img src={logo} alt="SalinTinig" className="h-full w-full object-contain filter drop-shadow brightness-0 invert" />
          </div>

          <div className="flex-1">
            <h3 className="font-bold text-lg text-[#202124] tracking-tight leading-snug">
              Continue in the app
            </h3>
            <p className="text-xs text-[#5f6368] leading-relaxed mt-1">
              Enjoy faster assessment recording, offline progress tracking, and a smoother experience on Android.
            </p>
          </div>
        </div>

        {/* Action Buttons Row (Canva-style) */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#f1f3f4]">
          <button
            type="button"
            onClick={handleStayOnWeb}
            className="px-4 py-2.5 text-xs sm:text-sm font-bold text-[#5f6368] hover:text-[#202124] hover:bg-[#f8f9fa] rounded-full transition-colors cursor-pointer"
          >
            Stay on web
          </button>
          
          <button
            type="button"
            onClick={handleOpenApp}
            className="px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-[#1a73e8] hover:bg-[#1557b0] rounded-full shadow-sm hover:shadow transition-colors cursor-pointer"
          >
            Open app
          </button>
        </div>

      </div>
    </div>
  );
}
