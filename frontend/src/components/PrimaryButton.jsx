export default function PrimaryButton({ children, className = '', ...props }) {
  return (
    <button
      className={`w-full max-w-[500px] rounded-[10px] bg-brand-blue px-6 py-4 text-base font-medium text-cream transition-colors hover:bg-blue-700 disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
