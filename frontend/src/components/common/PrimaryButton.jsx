export default function PrimaryButton({ children, className = '', ...props }) {
  return (
    <button
      className={`w-full rounded-[10px] bg-brand-blue px-6 py-3.5 text-base font-medium text-cream transition-colors hover:bg-blue-700 disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
