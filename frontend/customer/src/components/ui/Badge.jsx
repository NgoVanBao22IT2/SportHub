import React from 'react';

/**
 * Reusable Presentational Badge Primitive for SportHubAI Design System
 *
 * @param {Object} props
 * @param {'success' | 'warning' | 'error' | 'info' | 'neutral' | 'rating'} [props.variant='neutral']
 * @param {'sm' | 'md' | 'lg'} [props.size='md']
 * @param {React.ReactNode} [props.leftIcon]
 * @param {React.ReactNode} [props.rightIcon]
 * @param {string} [props.className='']
 * @param {React.ReactNode} [props.children]
 * @param {string} [props.ariaLabel]
 * @param {string} [props.title]
 */
export default function Badge({
  variant = 'neutral',
  size = 'md',
  leftIcon,
  rightIcon,
  className = '',
  children,
  ariaLabel,
  title,
  ...restProps
}) {
  const baseStyles = 'inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors select-none';

  // Variant mappings using TASK 01.01 tailwind.config.js tokens
  const variantStyles = {
    success: 'bg-status-success-bg text-status-success-text',
    warning: 'bg-status-warning-bg text-status-warning-text',
    error: 'bg-status-error-bg text-status-error-text',
    info: 'bg-status-info-bg text-status-info-text',
    neutral: 'bg-surface-muted text-text-muted-dark border border-border-subtle-medium',
    rating: 'bg-brand-orange-light text-brand-orange-hover font-bold',
  };

  // Size mappings (Rounded-full badge standard)
  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 rounded-full gap-1',
    md: 'text-sm px-2.5 py-1 rounded-full gap-1.5',
    lg: 'text-sm px-3 py-1.5 rounded-full gap-1.5',
  };

  const combinedClasses = [
    baseStyles,
    variantStyles[variant] || variantStyles.neutral,
    sizeStyles[size] || sizeStyles.md,
    className
  ].filter(Boolean).join(' ');

  return (
    <span
      className={combinedClasses}
      aria-label={ariaLabel}
      title={title}
      {...restProps}
    >
      {leftIcon && <span className="inline-flex flex-shrink-0 items-center">{leftIcon}</span>}
      {children && <span>{children}</span>}
      {rightIcon && <span className="inline-flex flex-shrink-0 items-center">{rightIcon}</span>}
    </span>
  );
}
