export default function TextField({ error, className = '', rightElement, ...props }) {
  if (rightElement) {
    return (
      <div className="relative flex w-full items-center">
        <input
          className={`w-full rounded-[10px] border-2 bg-transparent p-4 pr-12 text-base text-ink placeholder:text-ink/50 outline-none transition-colors focus:border-brand-blue ${
            error ? 'border-brand-red bg-brand-red/10' : 'border-ink/50'
          } ${className}`}
          {...props}
        />
        <div className="absolute right-4 flex items-center justify-center">
          {rightElement}
        </div>
      </div>
    );
  }

  return (
    <input
      className={`w-full rounded-[10px] border-2 bg-transparent p-4 text-base text-ink placeholder:text-ink/50 outline-none transition-colors focus:border-brand-blue ${
        error ? 'border-brand-red bg-brand-red/10' : 'border-ink/50'
      } ${className}`}
      {...props}
    />
  );
}
