import React, { forwardRef } from 'react';

/**
 * Reusable ErrorState Primitive Component for SportHubAI Design System
 *
 * @param {Object} props
 * @param {React.ReactNode} [props.icon] - Error icon or illustration
 * @param {string|React.ReactNode} [props.title] - Main error heading
 * @param {string|React.ReactNode} [props.description] - Detailed error explanation or recovery guidance
 * @param {React.ReactNode} [props.action] - Primary recovery action (e.g. Retry Button)
 * @param {React.ReactNode} [props.secondaryAction] - Optional secondary action (e.g. Contact Support/Home)
 * @param {'sm' | 'md' | 'lg'} [props.size='md'] - Layout scale variant
 * @param {string} [props.className='']
 */
const ErrorState = forwardRef(function ErrorState(
  {
    icon,
    title = 'Đã xảy ra lỗi',
    description,
    action,
    secondaryAction,
    size = 'md',
    className = '',
    ...restProps
  },
  ref
) {
  // Container padding scale (4px Tailwind grid)
  const containerSizeStyles = {
    sm: 'p-6 max-w-sm',
    md: 'p-10 max-w-md',
    lg: 'p-14 max-w-lg',
  };

  // Icon container scale
  const iconSizeStyles = {
    sm: 'w-10 h-10 text-xl mb-3',
    md: 'w-14 h-14 text-2xl mb-4',
    lg: 'w-20 h-20 text-3xl mb-5',
  };

  // Title typography scale
  const titleSizeStyles = {
    sm: 'text-base font-bold',
    md: 'text-lg font-bold',
    lg: 'text-xl font-bold',
  };

  // Description typography scale
  const descSizeStyles = {
    sm: 'text-xs mt-1',
    md: 'text-sm mt-1.5',
    lg: 'text-base mt-2',
  };

  const containerClasses = [
    'w-full mx-auto flex flex-col items-center justify-center text-center select-none',
    containerSizeStyles[size] || containerSizeStyles.md,
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={ref}
      role="alert"
      aria-live="assertive"
      className={containerClasses}
      {...restProps}
    >
      {icon && (
        <div
          className={[
            'rounded-full bg-status-error-bg text-status-error flex items-center justify-center border border-status-error-bg shadow-sm transition-transform duration-200',
            iconSizeStyles[size] || iconSizeStyles.md
          ].join(' ')}
          aria-hidden="true"
        >
          {icon}
        </div>
      )}

      {title && (
        <h3 className={['text-gray-900 leading-snug', titleSizeStyles[size] || titleSizeStyles.md].join(' ')}>
          {title}
        </h3>
      )}

      {description && (
        <p className={['text-text-muted max-w-xs leading-relaxed', descSizeStyles[size] || descSizeStyles.md].join(' ')}>
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
});

export default ErrorState;
