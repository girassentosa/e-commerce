/**
 * Input Component
 * Reusable input field dengan label dan error handling
 */

import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      fullWidth = false,
      type = 'text',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-gray-700"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <input
          ref={ref}
          type={type}
          id={inputId}
          className={cn(
            'px-3 py-2 border rounded-lg text-sm transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
            'disabled:bg-gray-100 disabled:cursor-not-allowed',
            'bg-white text-gray-900',
            // iOS fixes: ensure text is visible and input is properly styled
            type === 'date' || type === 'time' || type === 'datetime-local'
              ? 'min-w-0'
              : '',
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300',
            fullWidth && 'w-full',
            className
          )}
          style={{
            // Ensure text color is not transparent on iOS
            WebkitTextFillColor: 'inherit',
            color: 'inherit',
          }}
          {...props}
        />
        
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        
        {helperText && !error && (
          <p className="text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

