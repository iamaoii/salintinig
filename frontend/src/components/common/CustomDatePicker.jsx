import { useState, useRef, useEffect } from 'react';
import { CalendarBlank, CaretLeft, CaretRight, X } from '@phosphor-icons/react';

export default function CustomDatePicker({ value, onChange, minDate, placeholder = 'Select due date...' }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Selected date object or current date reference
  const selectedDateObj = value ? new Date(value + 'T00:00:00') : null;
  const todayObj = new Date();

  // Current displayed calendar month/year view state
  const [viewDate, setViewDate] = useState(selectedDateObj || todayObj);

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth(); // 0-indexed

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Close calendar popover on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute days matrix for current month view
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 (Sun) - 6 (Sat)
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Previous month trailing days
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

  const handlePrevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleSelectDay = (day) => {
    const monthStr = String(currentMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${currentYear}-${monthStr}-${dayStr}`;
    onChange(dateStr);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
  };

  // Format date for display button (e.g., "Aug 25, 2026")
  const formatDisplay = (dateString) => {
    if (!dateString) return placeholder;
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isDayDisabled = (day) => {
    if (!minDate) return false;
    const monthStr = String(currentMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${currentYear}-${monthStr}-${dayStr}`;
    return dateStr < minDate;
  };

  const isDaySelected = (day) => {
    if (!value) return false;
    const monthStr = String(currentMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${currentYear}-${monthStr}-${dayStr}`;
    return dateStr === value;
  };

  const isToday = (day) => {
    return (
      day === todayObj.getDate() &&
      currentMonth === todayObj.getMonth() &&
      currentYear === todayObj.getFullYear()
    );
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Date Trigger Input Box */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-ink outline-none hover:border-brand-blue/50 focus:border-brand-blue transition-colors cursor-pointer"
      >
        <span className={value ? 'text-ink font-bold' : 'text-ink/40 font-normal'}>
          {formatDisplay(value)}
        </span>
        <div className="flex items-center gap-1 text-ink/50">
          {value && (
            <span
              onClick={handleClear}
              className="rounded-full p-0.5 hover:bg-ink/10 hover:text-ink transition-colors"
            >
              <X size={14} weight="bold" />
            </span>
          )}
          <CalendarBlank size={18} className="text-brand-blue" weight="bold" />
        </div>
      </button>

      {/* Styled Popover Calendar */}
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-72 rounded-2xl border border-ink/10 bg-white p-4 shadow-xl animate-in fade-in zoom-in-95 duration-150">
          {/* Calendar Header: Month/Year & Controls */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-ink">
              {monthNames[currentMonth]} {currentYear}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="flex size-7 items-center justify-center rounded-lg border border-ink/10 bg-cream text-ink/70 hover:bg-ink/5 hover:text-ink transition-colors cursor-pointer"
              >
                <CaretLeft size={14} weight="bold" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="flex size-7 items-center justify-center rounded-lg border border-ink/10 bg-cream text-ink/70 hover:bg-ink/5 hover:text-ink transition-colors cursor-pointer"
              >
                <CaretRight size={14} weight="bold" />
              </button>
            </div>
          </div>

          {/* Weekday Names Header */}
          <div className="grid grid-cols-7 text-center mb-1 text-[11px] font-bold text-ink/40">
            <span>Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold">
            {/* Trailing days from previous month */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <span key={`prev-${i}`} className="py-1.5 text-ink/20 font-normal">
                {prevMonthDays - firstDayOfMonth + i + 1}
              </span>
            ))}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const disabled = isDayDisabled(day);
              const selected = isDaySelected(day);
              const today = isToday(day);

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleSelectDay(day)}
                  className={`flex size-8 items-center justify-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selected
                      ? 'bg-brand-blue text-white shadow-2xs'
                      : disabled
                      ? 'text-ink/20 line-through opacity-40 cursor-not-allowed'
                      : today
                      ? 'border border-brand-blue text-brand-blue bg-blue-50/50 hover:bg-brand-blue hover:text-white'
                      : 'text-ink hover:bg-brand-blue/10 hover:text-brand-blue'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer Quick Action Bar */}
          <div className="mt-3 flex items-center justify-between border-t border-ink/10 pt-2.5 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className="text-ink/50 hover:text-brand-red cursor-pointer"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={() => {
                const monthStr = String(todayObj.getMonth() + 1).padStart(2, '0');
                const dayStr = String(todayObj.getDate()).padStart(2, '0');
                onChange(`${todayObj.getFullYear()}-${monthStr}-${dayStr}`);
                setIsOpen(false);
              }}
              className="text-brand-blue hover:underline cursor-pointer"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
