import React, { forwardRef } from 'react';

/**
 * Reusable Card Primitive Component for SportHubAI Design System
 *
 * @param {Object} props
 * @param {'default' | 'subtle' | 'outlined' | 'elevated'} [props.variant='default']
 * @param {'none' | 'sm' | 'md' | 'lg'} [props.padding='md']
 * @param {'md' | 'lg' | 'xl' | '2xl'} [props.radius='lg']
 * @param {'none' | 'sm' | 'md' | 'lg'} [props.shadow='sm']
 * @param {React.ElementType} [props.as='div']
 * @param {string} [props.className='']
 * @param {React.ReactNode} [props.children]
 */
const Card = forwardRef(function Card(
  {
    variant = 'default',
    padding = 'md',
    radius = 'lg',
    shadow = 'sm',
    as: Component = 'div',
    className = '',
    children,
    ...restProps
  },
  ref
) {
  // Base layout styling
  const baseStyles = 'overflow-hidden transition-shadow duration-200';

  // Variant mappings using TASK 01.01 tokens
  const variantStyles = {
    default: 'bg-surface border border-border-subtle',
    subtle: 'bg-surface-subtle border border-border-subtle',
    outlined: 'bg-surface border border-border-subtle-medium shadow-none',
    elevated: 'bg-surface border border-border-subtle',
  };

  // Padding scale (4px Tailwind grid)
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  // Radius mappings
  const radiusStyles = {
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
  };

  // Shadow hierarchy mappings
  const shadowStyles = {
    none: 'shadow-none',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
  };

  // Variant shadow overrides (elevated uses shadow-md unless explicitly overridden)
  const effectiveShadow = variant === 'elevated' && shadow === 'sm' ? 'shadow-md' : shadow;

  const combinedClasses = [
    baseStyles,
    variantStyles[variant] || variantStyles.default,
    paddingStyles[padding] || paddingStyles.md,
    radiusStyles[radius] || radiusStyles.lg,
    shadowStyles[effectiveShadow] || shadowStyles.sm,
    className
  ].filter(Boolean).join(' ');

  return (
    <Component ref={ref} className={combinedClasses} {...restProps}>
      {children}
    </Component>
  );
});

// Presentational Subcomponents
const CardHeader = forwardRef(function CardHeader({ className = '', children, ...restProps }, ref) {
  return (
    <div ref={ref} className={['mb-4', className].filter(Boolean).join(' ')} {...restProps}>
      {children}
    </div>
  );
});

const CardBody = forwardRef(function CardBody({ className = '', children, ...restProps }, ref) {
  return (
    <div ref={ref} className={className} {...restProps}>
      {children}
    </div>
  );
});

const CardFooter = forwardRef(function CardFooter({ className = '', children, ...restProps }, ref) {
  return (
    <div ref={ref} className={['mt-4 pt-4 border-t border-border-subtle', className].filter(Boolean).join(' ')} {...restProps}>
      {children}
    </div>
  );
});

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
