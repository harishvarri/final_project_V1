export default function Button({ children, variant = 'primary', className = '', disabled = false, ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const variants = {
    primary: 'gradient-blue text-white hover:opacity-90 shadow-md hover:shadow-lg',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
    danger: 'bg-red-500 text-white hover:bg-red-600 shadow-md',
    success: 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md',
    ghost: 'text-blue-600 hover:bg-blue-50',
    white: 'bg-white text-blue-800 hover:bg-gray-100 shadow-lg hover:shadow-xl font-bold',
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} disabled={disabled} {...props}>
      {children}
    </button>
  );
}
