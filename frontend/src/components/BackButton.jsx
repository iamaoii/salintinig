import { useNavigate } from 'react-router-dom';
import icon from '../assets/icon-back.svg';

export default function BackButton({ to, size = 32, light = false }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => (to ? navigate(to) : navigate(-1))}
      aria-label="Go back"
      className="shrink-0"
      style={{ width: size, height: size }}
    >
      <img src={icon} alt="" className={`size-full ${light ? 'brightness-0 invert' : ''}`} />
    </button>
  );
}
