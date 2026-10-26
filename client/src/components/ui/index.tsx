import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ------------------------------------
// BUTTON
// ------------------------------------
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'frosted';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#176087] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer';

    const variants = {
      primary: 'bg-[#176087] text-white hover:bg-[#124b6a] shadow-[0_2px_12px_rgba(23,96,135,0.20)] active:scale-[0.98]',
      secondary: 'bg-[#0A2239] text-white hover:bg-[#071727] active:scale-[0.98]',
      outline: 'border border-[#176087]/30 bg-transparent text-[#176087] hover:bg-[#9ED8ED]/20 active:scale-[0.98] dark:text-[#9ED8ED] dark:border-[#9ED8ED]/30',
      ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800',
      danger: 'bg-rose-600 text-white hover:bg-rose-700 active:scale-[0.98]',
      frosted: 'bg-[#9ED8ED] text-[#0A2239] hover:bg-[#86cce5] font-semibold active:scale-[0.98]'
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
      md: 'h-10 px-4 py-2 text-sm rounded-[10px] gap-2',
      lg: 'h-12 px-6 text-base rounded-xl gap-2.5',
      icon: 'h-10 w-10 p-0 rounded-lg justify-center'
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

// ------------------------------------
// CARD
// ------------------------------------
export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div
    className={cn(
      'rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(23,96,135,0.06)] dark:border-slate-800 dark:bg-[#0A2239]/90 dark:text-slate-100 transition-colors',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

// ------------------------------------
// BADGE
// ------------------------------------
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'frosted' | 'prussian' | 'success' | 'warning' | 'danger' | 'outline';
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = 'primary', children, ...props }) => {
  const variants = {
    primary: 'bg-[#176087]/10 text-[#176087] dark:bg-[#176087]/20 dark:text-[#9ED8ED]',
    frosted: 'bg-[#9ED8ED]/30 text-[#0A2239] font-medium dark:bg-[#9ED8ED]/20 dark:text-[#9ED8ED]',
    prussian: 'bg-[#0A2239] text-white',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/40',
    outline: 'border border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-md tracking-tight',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

// ------------------------------------
// INPUT
// ------------------------------------
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, type = 'text', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={cn(
            'w-full h-10 px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 transition-all duration-150',
            'focus:outline-none focus:border-[#176087] focus:ring-2 focus:ring-[#176087]/20',
            'dark:bg-[#071727] dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-[#9ED8ED]',
            error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

// ------------------------------------
// INFO TOOLTIP (P3.1)
// ------------------------------------
import { Info } from 'lucide-react';

export const InfoTooltip: React.FC<{ content: string; className?: string }> = ({ content, className }) => {
  const [open, setOpen] = React.useState(false);

  return (
    <div className={cn('relative inline-flex items-center', className)}>
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen(!open)}
        className="text-slate-400 hover:text-[#176087] dark:hover:text-[#9ED8ED] transition-colors p-0.5 rounded cursor-pointer"
        aria-label="Más información"
      >
        <Info size={14} />
      </button>

      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-2.5 bg-slate-900 text-white text-xs rounded-xl shadow-xl z-50 pointer-events-none border border-slate-700 leading-relaxed font-normal">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
};

// ------------------------------------
// SKELETON
// ------------------------------------
export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('animate-pulse bg-slate-200/80 dark:bg-slate-800/80 rounded-xl', className || 'h-32 w-full')} />
);

// ------------------------------------
// EMPTY STATE
// ------------------------------------
export const EmptyState: React.FC<{
  mensaje: string;
  submensaje?: string;
  accionTexto?: string;
  onAccion?: () => void;
  icon?: React.ReactNode;
  className?: string;
}> = ({ mensaje, submensaje, accionTexto, onAccion, icon, className }) => (
  <div className={cn('flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-[#071727]/40', className)}>
    {icon && <div className="mb-3 text-slate-400 dark:text-slate-500">{icon}</div>}
    <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200">{mensaje}</h3>
    {submensaje && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">{submensaje}</p>}
    {accionTexto && onAccion && (
      <Button variant="primary" size="sm" onClick={onAccion} className="mt-4">
        {accionTexto}
      </Button>
    )}
  </div>
);


