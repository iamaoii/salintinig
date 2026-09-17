import { useRef, useState } from 'react';

export default function OtpInput({ length = 6, onChange }) {
  const [values, setValues] = useState(Array(length).fill(''));
  const inputsRef = useRef([]);

  const update = (next) => {
    setValues(next);
    onChange?.(next.join(''));
  };

  const handleChange = (index, e) => {
    const digit = e.target.value.replace(/[^0-9]/g, '').slice(-1);
    const next = [...values];
    next[index] = digit;
    update(next);
    if (digit && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !values[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex items-center justify-center gap-[5px]">
      {values.map((digit, i) => (
        <input
          key={i}
          ref={(el) => (inputsRef.current[i] = el)}
          value={digit}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          inputMode="numeric"
          maxLength={1}
          className={`size-[50px] rounded-[5px] border-2 bg-transparent text-center text-xl outline-none transition-colors focus:border-ink ${
            digit ? 'border-ink' : 'border-ink/50'
          }`}
        />
      ))}
    </div>
  );
}
