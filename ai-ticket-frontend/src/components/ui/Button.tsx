import React from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'primary'
    | 'secondary'
    | 'danger'
    | 'success'
    | 'warning'
    | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  rounded?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  rounded = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = `
    inline-flex items-center justify-center font-medium transition-all duration-200 
    focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 
    disabled:cursor-not-allowed select-none
  `.trim();

  const variantClasses = {
    primary: `
      bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 
      text-white shadow-md hover:shadow-lg focus:ring-blue-500
    `,
    secondary: `
      bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 
      text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 
      focus:ring-gray-500 shadow-sm hover:shadow-md
    `,
    danger: `
      bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 
      text-white shadow-md hover:shadow-lg focus:ring-red-500
    `,
    success: `
      bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 
      text-white shadow-md hover:shadow-lg focus:ring-green-500
    `,
    warning: `
      bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 
      text-white shadow-md hover:shadow-lg focus:ring-yellow-500
    `,
    outline: `
      bg-transparent border-2 border-blue-600 text-blue-600 hover:bg-blue-600 
      hover:text-white focus:ring-blue-500
    `,
  };

  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg',
  };

  const iconSizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
    xl: 'h-6 w-6',
  };

  const roundedClass = rounded ? 'rounded-full' : 'rounded-lg';
  const widthClass = fullWidth ? 'w-full' : '';

  const finalClassName = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${roundedClass}
    ${widthClass}
    ${className}
  `
    .replace(/\s+/g, ' ')
    .trim();

  const iconSize = iconSizeClasses[size];

  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      className={finalClassName}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className={`${iconSize} border-2 border-current border-t-transparent rounded-full ${
            Icon || iconPosition === 'left' ? 'mr-2' : ''
          }`}
        />
      ) : (
        Icon &&
        iconPosition === 'left' && (
          <Icon className={`${iconSize} ${children ? 'mr-2' : ''}`} />
        )
      )}

      {children}

      {!loading && Icon && iconPosition === 'right' && (
        <Icon className={`${iconSize} ${children ? 'ml-2' : ''}`} />
      )}
    </motion.button>
  );
};

export default Button;
