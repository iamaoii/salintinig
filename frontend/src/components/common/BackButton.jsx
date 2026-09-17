import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';

export default function BackButton({ to, onClick, label, size = 20, light = false }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => {
        if (onClick) {
          onClick();
        } else if (to) {
          navigate(to);
        } else {
          navigate(-1);
        }
      }}
      aria-label={label || 'Go back'}
      className="group inline-flex items-center gap-2.5 text-xs font-semibold text-ink/70 hover:text-ink transition-colors cursor-pointer"
    >
      <ArrowLeft
        size={size}
        weight="bold"
        className={light ? 'text-white' : 'text-ink shrink-0'}
      />
      {label && <span className="group-hover:underline">{label}</span>}
    </button>
  );
}
