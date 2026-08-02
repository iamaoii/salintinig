import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';

export default function BackButton({ to, onClick, size = 32, light = false }) {
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
      aria-label="Go back"
      className="shrink-0 cursor-pointer"
      style={{ width: size, height: size }}
    >
      <ArrowLeft
        size={size}
        weight="bold"
        className={light ? 'text-white' : 'text-ink'}
      />
    </button>
  );
}
