import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, WarningCircle, Info, X } from '@phosphor-icons/react';

export default function ToastNotification({ message, type = 'success', onClose }) {
  // Safely extract text string and notification type whether message is string or object { text, type } / { message, type }
  const textContent =
    typeof message === 'object' && message !== null
      ? message.text || message.message || ''
      : typeof message === 'string'
      ? message
      : '';

  const notificationType =
    typeof message === 'object' && message !== null && message.type
      ? message.type
      : type;

  const [visibleMessage, setVisibleMessage] = useState(textContent);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    if (textContent) {
      setVisibleMessage(textContent);
      setIsFading(false);

      // Auto-dismiss after 4 seconds
      const dismissTimer = setTimeout(() => {
        setIsFading(true);
        setTimeout(() => {
          if (onClose) onClose();
        }, 400);
      }, 4000);

      return () => clearTimeout(dismissTimer);
    } else if (visibleMessage) {
      setIsFading(true);
      const timer = setTimeout(() => {
        setVisibleMessage('');
        setIsFading(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [textContent]);

  const handleClose = () => {
    setIsFading(true);
    setTimeout(() => {
      if (onClose) onClose();
    }, 350);
  };

  if (!visibleMessage && !textContent) return null;

  const bgStyle =
    notificationType === 'error'
      ? 'bg-brand-red text-white'
      : notificationType === 'info'
      ? 'bg-brand-blue text-white'
      : 'bg-[#00a652] text-white';

  return createPortal(
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          pointerEvents: 'auto',
          transition: 'opacity 0.35s ease, transform 0.35s ease',
          opacity: isFading ? 0 : 1,
          transform: isFading ? 'translateY(8px) scale(0.96)' : 'translateY(0) scale(1)',
        }}
        className={`flex items-center gap-3 rounded-2xl ${bgStyle} px-4 py-3 text-xs font-bold shadow-[0_10px_30px_-5px_rgba(0,0,0,0.25)] border border-white/20`}
      >
        {notificationType === 'error' && <WarningCircle size={18} weight="fill" className="shrink-0" />}
        {notificationType === 'info' && <Info size={18} weight="fill" className="shrink-0" />}
        {notificationType === 'success' && <CheckCircle size={18} weight="fill" className="shrink-0" />}
        <span className="leading-tight">{visibleMessage || textContent}</span>
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
    </div>,
    document.body
  );
}
