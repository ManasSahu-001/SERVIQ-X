import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base font-semibold',
  }[size];

  const variantClasses = {
    primary:
      'bg-[#FFB33F] hover:bg-[#F5A623] text-black font-semibold shadow-sm hover:shadow-[0_0_20px_rgba(255,179,63,0.3)] transition-all duration-200 active:scale-[0.98]',
    secondary:
      'bg-[#1F1F28] hover:bg-[#282835] text-white border border-[#292932] transition-colors active:scale-[0.98]',
    outline:
      'bg-transparent hover:bg-white/5 text-gray-200 border border-[#292932] hover:border-gray-500 transition-colors',
    danger:
      'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors',
    ghost:
      'bg-transparent hover:bg-white/5 text-gray-300 hover:text-white transition-colors',
  }[variant];

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none ${sizeClasses} ${variantClasses} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {leftIcon}
          {children}
          {rightIcon}
        </>
      )}
    </button>
  );
};
