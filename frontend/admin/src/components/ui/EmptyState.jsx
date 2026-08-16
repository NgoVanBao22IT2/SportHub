import React, { forwardRef } from 'react';

/**
 * Reusable EmptyState Primitive Component for SportHubAI Design System
 *
 * @param {Object} props
 * @param {React.ReactNode} [props.icon] - Icon or illustration to display
 * @param {string|React.ReactNode} [props.title] - Main title message
 * @param {string|React.ReactNode} [props.description] - Supporting explanatory text
 * @param {React.ReactNode} [props.action] - Primary recovery action (e.g. Button)
 * @param {React.ReactNode} [props.secondaryAction] - Optional secondary action
 * @param {'sm' | 'md' | 'lg'} [props.size='md'] - Layout scale variant
 * @param {string} [props.className='']
 */
const EmptyState = forwardRef(function EmptyState(
  {
    icon,
    title = 'Chưa có dữ liệu',
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
      role="status"
      aria-live="polite"
      className={containerClasses}
      {...restProps}
    >
      {icon && (
        <div
          className={[
            'rounded-full bg-surface-muted text-text-muted flex items-center justify-center border border-border-subtle-medium shadow-sm transition-transform duration-200',
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

export default EmptyState;
