import { useState, useEffect } from 'react';
import { CheckCircle, WarningCircle, Info, X } from '@phosphor-icons/react';

export default function ToastNotification({ message, type = 'success', onClose }) {
  const [visibleMessage, setVisibleMessage] = useState(message);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    if (message) {
      setVisibleMessage(message);
      setIsFading(false);
    } else if (visibleMessage) {
      setIsFading(true);
      const timer = setTimeout(() => {
        setVisibleMessage(null);
        setIsFading(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [message, visibleMessage]);

  const handleClose = () => {
    setIsFading(true);
    setTimeout(() => {
      if (onClose) onClose();
    }, 350);
  };

  if (!visibleMessage && !message) return null;

  const bgStyle =
    type === 'error'
      ? 'bg-brand-red text-white'
      : type === 'info'
      ? 'bg-brand-blue text-white'
      : 'bg-[#00a652] text-white';

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[9999] flex items-center justify-end">
      <div
        className={`pointer-events-auto flex items-center gap-3 rounded-2xl ${bgStyle} px-4 py-3 text-xs font-bold shadow-[0_10px_30px_-5px_rgba(0,0,0,0.25)] border border-white/20 transition-all duration-400 ease-out ${
          isFading
            ? 'opacity-0 translate-y-3 scale-95'
            : 'opacity-100 translate-y-0 scale-100 animate-in fade-in slide-in-from-bottom-5 duration-300'
        } backdrop-blur-xs`}
      >
        {type === 'error' && <WarningCircle size={18} weight="fill" className="shrink-0" />}
        {type === 'info' && <Info size={18} weight="fill" className="shrink-0" />}
        {type === 'success' && <CheckCircle size={18} weight="fill" className="shrink-0" />}
        <span className="leading-tight">{visibleMessage || message}</span>
        {onClose && (
          <button
            type="button"
            onClick={handleClose}
            className="ml-1 rounded-full p-0.5 hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X size={14} weight="bold" />
          </button>
        )}
      </div>
    </div>
  );
}
