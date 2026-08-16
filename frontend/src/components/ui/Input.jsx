import React, { forwardRef, useId } from 'react';

/**
 * Reusable Input Primitive Component for SportHubAI Design System
 *
 * @param {Object} props
 * @param {string} [props.label]
 * @param {string} [props.name]
 * @param {string} [props.type='text']
 * @param {string|number} [props.value]
 * @param {string|number} [props.defaultValue]
 * @param {string} [props.placeholder]
 * @param {Function} [props.onChange]
 * @param {Function} [props.onBlur]
 * @param {Function} [props.onFocus]
 * @param {boolean} [props.disabled=false]
 * @param {boolean} [props.required=false]
 * @param {boolean} [props.readOnly=false]
 * @param {string} [props.error]
 * @param {string} [props.helperText]
 * @param {React.ReactNode} [props.leftIcon]
 * @param {React.ReactNode} [props.rightIcon]
 * @param {'sm' | 'md' | 'lg'} [props.size='md']
 * @param {string} [props.id]
 * @param {string} [props.className='']
 * @param {string} [props.inputClassName='']
 */
const Input = forwardRef(function Input(
  {
    label,
    name,
    type = 'text',
    value,
    defaultValue,
    placeholder,
    onChange,
    onBlur,
    onFocus,
    disabled = false,
    required = false,
    readOnly = false,
    error,
    helperText,
    leftIcon,
    rightIcon,
    size = 'md',
    id,
    className = '',
    inputClassName = '',
    ...restProps
  },
  ref
) {
  // Stable ID generation for accessibility label/describedby linkage
  const generatedId = useId();
  const inputId = id || generatedId || name;
  const errorId = error && inputId ? `${inputId}-error` : undefined;
  const helperId = helperText && !error && inputId ? `${inputId}-helper` : undefined;
  const describedBy = errorId || helperId || undefined;

  // Base input container layout
  const containerClasses = ['w-full flex flex-col gap-1.5', className].filter(Boolean).join(' ');

  // Size variant mappings (4px Tailwind grid)
  const sizeStyles = {
    sm: 'text-xs py-1.5 px-3 rounded-md',
    md: 'text-sm py-2.5 px-3.5 rounded-lg',
    lg: 'text-base py-3 px-4 rounded-lg',
  };

  // Icon padding adjustments
  const leftPadding = leftIcon ? (size === 'sm' ? 'pl-8' : size === 'lg' ? 'pl-11' : 'pl-10') : '';
  const rightPadding = rightIcon ? (size === 'sm' ? 'pr-8' : size === 'lg' ? 'pr-11' : 'pr-10') : '';

  // Base Input Styling
  const baseInputStyles = 'w-full bg-surface text-gray-900 placeholder:text-text-muted border transition-colors duration-200 focus:outline-none select-none font-normal';

  // State styling rules
  let stateStyles = 'border-border-subtle-strong focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20';

  if (error) {
    stateStyles = 'border-status-error focus:border-status-error focus:ring-2 focus:ring-status-error/20';
  } else if (disabled) {
    stateStyles = 'bg-surface-muted text-text-muted cursor-not-allowed border-border-subtle-medium';
  } else if (readOnly) {
    stateStyles = 'bg-surface-subtle cursor-default border-border-subtle-medium focus:ring-0 focus:border-border-subtle-medium';
  }

  const combinedInputClasses = [
    baseInputStyles,
    sizeStyles[size] || sizeStyles.md,
    leftPadding,
    rightPadding,
    stateStyles,
    inputClassName
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-text-muted-dark flex items-center gap-1"
        >
          <span>{label}</span>
          {required && <span className="text-status-error font-bold" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="relative w-full flex items-center">
        {leftIcon && (
          <div
            className="absolute left-3 flex items-center justify-center text-text-muted pointer-events-none"
            aria-hidden="true"
          >
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          name={name}
          type={type}
          value={value}
          defaultValue={defaultValue}
          placeholder={placeholder}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          disabled={disabled}
          required={required}
          readOnly={readOnly}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={combinedInputClasses}
          {...restProps}
        />

        {rightIcon && (
          <div
            className="absolute right-3 flex items-center justify-center text-text-muted pointer-events-none"
            aria-hidden="true"
          >
            {rightIcon}
          </div>
        )}
      </div>

      {error ? (
        <p id={errorId} className="text-xs font-medium text-status-error">
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-xs text-text-muted">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

export default Input;
