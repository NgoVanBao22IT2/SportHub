import React, { forwardRef } from 'react';

/**
 * Reusable Skeleton Loading Primitive for SportHubAI Design System
 *
 * @param {Object} props
 * @param {'text' | 'rectangular' | 'circular' | 'rounded'} [props.variant='text']
 * @param {'pulse' | 'none'} [props.animation='pulse']
 * @param {string | number} [props.width]
 * @param {string | number} [props.height]
 * @param {string | number} [props.size]
 * @param {string} [props.className='']
 * @param {Object} [props.style]
 */
const Skeleton = forwardRef(function Skeleton(
  {
    variant = 'text',
    animation = 'pulse',
    width,
    height,
    size,
    className = '',
    style = {},
    ...restProps
  },
  ref
) {
  // Base styling for skeleton loading state
  const baseStyles = 'bg-surface-muted select-none pointer-events-none block';

  // Animation mapping
  const animationStyles = {
    pulse: 'animate-pulse',
    none: '',
  };

  // Border radius mappings per variant
  const variantStyles = {
    text: 'rounded-md',
    rectangular: 'rounded-none',
    circular: 'rounded-full',
    rounded: 'rounded-lg',
  };

  // Determine default dimensions if not explicitly passed
  const effectiveWidth = width ?? (size ?? (variant === 'circular' ? '2.5rem' : '100%'));
  const effectiveHeight = height ?? (size ?? (variant === 'circular' ? '2.5rem' : variant === 'text' ? '1rem' : '8rem'));

  // Convert numbers to px strings safely
  const formatDimension = (val) => (typeof val === 'number' ? `${val}px` : val);

  const customStyles = {
    width: formatDimension(effectiveWidth),
    height: formatDimension(effectiveHeight),
    ...style,
  };

  const combinedClasses = [
    baseStyles,
    variantStyles[variant] || variantStyles.text,
    animationStyles[animation] ?? animationStyles.pulse,
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={ref}
      className={combinedClasses}
      style={customStyles}
      aria-hidden="true"
      {...restProps}
    />
  );
});

export default Skeleton;
