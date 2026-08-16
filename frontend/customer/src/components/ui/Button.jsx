import React from 'react';

/**
 * Button Primitive Component for SportHubAI Design System
 *
 * @param {Object} props
 * @param {'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'} [props.variant='primary']
 * @param {'sm' | 'md' | 'lg'} [props.size='md']
 * @param {boolean} [props.disabled=false]
 * @param {boolean} [props.loading=false]
 * @param {'button' | 'submit' | 'reset'} [props.type='button']
 * @param {Function} [props.onClick]
 * @param {string} [props.className='']
 * @param {React.ReactNode} [props.children]
 * @param {React.ReactNode} [props.leftIcon]
 * @param {React.ReactNode} [props.rightIcon]
 * @param {boolean} [props.fullWidth=false]
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  type = 'button',
  onClick,
  className = '',
  children,
  leftIcon,
  rightIcon,
  fullWidth = false,
  ...restProps
}) {
  // Base styling rules
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-orange disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none select-none';

  // Variant mappings using TASK 01.01 tokens
  const variantStyles = {
    primary: 'bg-brand-orange hover:bg-brand-orange-hover text-white shadow-sm',
    secondary: 'bg-surface-subtle hover:bg-border-subtle text-gray-800 border border-border-subtle-medium',
    outline: 'border border-border-subtle-medium bg-transparent hover:bg-surface-subtle text-gray-700',
    ghost: 'bg-transparent hover:bg-surface-subtle text-gray-700',
    danger: 'bg-status-error hover:bg-status-error-text text-white shadow-sm focus-visible:ring-status-error',
  };

  // Size mappings (4px grid compliance)
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs rounded-md gap-1.5',
    md: 'px-5 py-2.5 text-sm rounded-lg gap-2',
    lg: 'px-6 py-3 text-base rounded-lg gap-2.5',
  };

  // Layout width
  const widthStyles = fullWidth ? 'w-full' : '';

  // Combine classes cleanly without third-party dependencies
  const combinedClasses = [
    baseStyles,
    variantStyles[variant] || variantStyles.primary,
    sizeStyles[size] || sizeStyles.md,
    widthStyles,
    className
  ].filter(Boolean).join(' ');

  const isInteractionDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isInteractionDisabled}
      onClick={isInteractionDisabled ? undefined : onClick}
      className={combinedClasses}
      aria-busy={loading}
      {...restProps}
    >
      {loading ? (
        <svg
          className="animate-spin h-4 w-4 text-current flex-shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      ) : (
        leftIcon && <span className="inline-flex flex-shrink-0 items-center">{leftIcon}</span>
      )}

      {children && <span>{children}</span>}

      {!loading && rightIcon && (
        <span className="inline-flex flex-shrink-0 items-center">{rightIcon}</span>
      )}
    </button>
  );
}
