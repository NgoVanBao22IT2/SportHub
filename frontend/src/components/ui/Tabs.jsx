import React, { forwardRef, createContext, useContext, useId } from 'react';

// Context to share active state and variant configuration with subcomponents
const TabsContext = createContext(null);

/**
 * Reusable Tabs Primitive Component for SportHubAI Design System
 *
 * @param {Object} props
 * @param {string} [props.activeTab] - Currently active tab identifier
 * @param {string} [props.defaultTab] - Default active tab if uncontrolled
 * @param {Function} [props.onChange] - Callback fired when active tab changes
 * @param {'line' | 'pills' | 'enclosed'} [props.variant='line'] - Visual style variant
 * @param {'sm' | 'md' | 'lg'} [props.size='md'] - Size variant
 * @param {Array<{id: string, label: React.ReactNode, icon?: React.ReactNode, disabled?: boolean, badge?: React.ReactNode}>} [props.items] - Optional declarative tab items list
 * @param {string} [props.className='']
 * @param {React.ReactNode} [props.children]
 */
const Tabs = forwardRef(function Tabs(
  {
    activeTab: controlledActiveTab,
    defaultTab,
    onChange,
    variant = 'line',
    size = 'md',
    items,
    className = '',
    children,
    ...restProps
  },
  ref
) {
  const [uncontrolledActiveTab, setUncontrolledActiveTab] = React.useState(defaultTab || (items && items[0]?.id) || '');
  const isControlled = controlledActiveTab !== undefined;
  const currentActiveTab = isControlled ? controlledActiveTab : uncontrolledActiveTab;

  const handleTabSelect = (tabId) => {
    if (!isControlled) {
      setUncontrolledActiveTab(tabId);
    }
    if (onChange) {
      onChange(tabId);
    }
  };

  const contextValue = {
    activeTab: currentActiveTab,
    onSelect: handleTabSelect,
    variant,
    size,
  };

  return (
    <TabsContext.Provider value={contextValue}>
      <div ref={ref} className={['w-full', className].filter(Boolean).join(' ')} {...restProps}>
        {items ? (
          <TabsList>
            {items.map((item) => (
              <Tab
                key={item.id}
                value={item.id}
                disabled={item.disabled}
                leftIcon={item.icon}
                badge={item.badge}
              >
                {item.label}
              </Tab>
            ))}
          </TabsList>
        ) : (
          children
        )}
      </div>
    </TabsContext.Provider>
  );
});

/**
 * TabsList Subcomponent - Container for Tabs (role="tablist")
 */
const TabsList = forwardRef(function TabsList({ className = '', children, ...restProps }, ref) {
  const { variant } = useContext(TabsContext) || {};

  const variantListStyles = {
    line: 'border-b border-border-subtle-medium flex overflow-x-auto scrollbar-none gap-2',
    pills: 'bg-surface-subtle p-1.5 rounded-xl inline-flex overflow-x-auto gap-1 border border-border-subtle-medium',
    enclosed: 'flex border-b border-border-subtle-medium overflow-x-auto gap-1',
  };

  const combinedClasses = [
    variantListStyles[variant] || variantListStyles.line,
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={ref}
      role="tablist"
      className={combinedClasses}
      {...restProps}
    >
      {children}
    </div>
  );
});

/**
 * Tab Subcomponent - Individual Tab Button (role="tab")
 */
const Tab = forwardRef(function Tab(
  {
    value,
    disabled = false,
    leftIcon,
    rightIcon,
    badge,
    className = '',
    children,
    onClick,
    ...restProps
  },
  ref
) {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tab must be rendered within a Tabs component');
  }

  const { activeTab, onSelect, variant, size } = context;
  const isActive = activeTab === value;
  const generatedId = useId();
  const tabId = `tab-${value || generatedId}`;
  const panelId = `panel-${value || generatedId}`;

  // Size styling rules
  const sizeStyles = {
    sm: 'text-xs py-1.5 px-3 gap-1.5 font-medium',
    md: 'text-sm py-2.5 px-4 gap-2 font-medium',
    lg: 'text-base py-3 px-5 gap-2.5 font-semibold',
  };

  // Base tab styling rules
  const baseStyles = 'inline-flex items-center justify-center whitespace-nowrap transition-all duration-200 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-accent-primary';

  // State & Variant styling rules
  let stateStyles = '';

  if (disabled) {
    stateStyles = 'opacity-40 cursor-not-allowed pointer-events-none text-text-muted';
  } else if (variant === 'line') {
    stateStyles = isActive
      ? 'border-b-2 border-accent-primary text-accent-primary font-semibold -mb-px'
      : 'border-b-2 border-transparent text-text-muted hover:text-text-muted-dark hover:border-border-subtle-strong';
  } else if (variant === 'pills') {
    stateStyles = isActive
      ? 'bg-surface text-accent-primary shadow-sm rounded-lg font-semibold'
      : 'text-text-muted hover:text-text-muted-dark hover:bg-surface/50 rounded-lg';
  } else if (variant === 'enclosed') {
    stateStyles = isActive
      ? 'bg-surface border-t-2 border-x border-t-accent-primary border-x-border-subtle-medium rounded-t-lg text-accent-primary font-semibold -mb-px bg-surface'
      : 'text-text-muted hover:text-text-muted-dark border-transparent rounded-t-lg';
  }

  const combinedClasses = [
    baseStyles,
    sizeStyles[size] || sizeStyles.md,
    stateStyles,
    className
  ].filter(Boolean).join(' ');

  const handleClick = (e) => {
    if (disabled) return;
    if (onClick) onClick(e);
    onSelect(value);
  };

  return (
    <button
      ref={ref}
      id={tabId}
      role="tab"
      type="button"
      aria-selected={isActive}
      aria-controls={panelId}
      tabIndex={isActive ? 0 : -1}
      disabled={disabled}
      onClick={handleClick}
      className={combinedClasses}
      {...restProps}
    >
      {leftIcon && <span className="inline-flex flex-shrink-0 items-center">{leftIcon}</span>}
      {children && <span>{children}</span>}
      {badge && <span className="inline-flex flex-shrink-0 items-center">{badge}</span>}
      {rightIcon && <span className="inline-flex flex-shrink-0 items-center">{rightIcon}</span>}
    </button>
  );
});

/**
 * TabPanel Subcomponent - Content Area associated with a Tab (role="tabpanel")
 */
const TabPanel = forwardRef(function TabPanel(
  {
    value,
    className = '',
    children,
    ...restProps
  },
  ref
) {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('TabPanel must be rendered within a Tabs component');
  }

  const { activeTab } = context;
  const isActive = activeTab === value;
  const generatedId = useId();
  const tabId = `tab-${value || generatedId}`;
  const panelId = `panel-${value || generatedId}`;

  if (!isActive) return null;

  return (
    <div
      ref={ref}
      id={panelId}
      role="tabpanel"
      aria-labelledby={tabId}
      tabIndex={0}
      className={['py-4 focus-visible:outline-none', className].filter(Boolean).join(' ')}
      {...restProps}
    >
      {children}
    </div>
  );
});

Tabs.List = TabsList;
Tabs.Tab = Tab;
Tabs.Panel = TabPanel;

export default Tabs;
