import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper, leftIcon, rightIcon, className = '', ...props }, ref) => {
    const baseClasses = 'w-full bg-surface border rounded-md text-sm transition-all duration-150 placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500';
    
    const stateClasses = error
      ? 'border-danger focus:border-danger focus:ring-danger/20'
      : 'border-border hover:border-border-hover';
    
    const iconPadding = leftIcon ? 'pl-10' : rightIcon ? 'pr-10' : '';
    
    const classes = [baseClasses, stateClasses, 'px-3 py-2', iconPadding, className]
      .filter(Boolean)
      .join(' ');

    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-medium text-text-secondary mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              {leftIcon}
            </div>
          )}
          <input ref={ref} className={classes} {...props} />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
        {helper && !error && <p className="mt-1.5 text-xs text-text-muted">{helper}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
