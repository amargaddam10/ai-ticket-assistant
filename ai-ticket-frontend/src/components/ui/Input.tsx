import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ComponentType<{ className?: string }>;
  rightIcon?: React.ComponentType<{ className?: string }>;
  startIcon?: React.ComponentType<{ className?: string }>; // For compatibility with your ForgotPassword
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      helperText,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      startIcon: StartIcon,
      fullWidth = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const IconComponent = StartIcon || LeftIcon; // Support both prop names

    return (
      <div className={cn('space-y-2', fullWidth && 'w-full')}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}

        <div className="relative">
          {IconComponent && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <IconComponent className="h-5 w-5 text-gray-400" />
            </div>
          )}

          <input
            type={type}
            className={cn(
              // Base styles with EXPLICIT TEXT COLORS
              'block w-full px-3 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700',
              'border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm',
              'placeholder-gray-500 dark:placeholder-gray-400',

              // Focus styles
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
              'dark:focus:ring-blue-400 dark:focus:border-blue-400',

              // Icon padding
              IconComponent && 'pl-10',
              RightIcon && 'pr-10',

              // Error styles
              error &&
                'border-red-500 dark:border-red-400 focus:ring-red-500 focus:border-red-500',

              // Disabled styles
              disabled &&
                'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800',

              // Custom className
              className
            )}
            disabled={disabled}
            ref={ref}
            {...props}
          />

          {RightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <RightIcon className="h-5 w-5 text-gray-400" />
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {/* Helper text */}
        {helperText && !error && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
