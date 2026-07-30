export default function TextField({ error, className = '', ...props }) {
  return (
    <input
      className={`w-full rounded-[10px] border-2 bg-transparent p-4 text-base text-ink placeholder:text-ink/50 outline-none transition-colors focus:border-brand-blue ${
        error ? 'border-brand-red bg-brand-red/10' : 'border-ink/50'
      } ${className}`}
      {...props}
    />
  );
}
