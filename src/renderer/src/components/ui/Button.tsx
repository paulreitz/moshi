import { Component, JSX, splitProps, Show } from 'solid-js';
import { Spinner } from './Spinner';

export interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button: Component<ButtonProps> = (props) => {
  const [local, rest] = splitProps(props, ['variant', 'size', 'class', 'children', 'loading', 'disabled']);

  const variant = local.variant ?? 'primary';
  const size = local.size ?? 'md';

  const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-primary disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles = {
    primary: 'bg-accent-primary text-text-primary hover:bg-accent-primary-hover focus:ring-accent-primary',
    secondary: 'bg-bg-elevated text-text-primary border border-border-default hover:bg-bg-hover focus:ring-border-default',
    ghost: 'text-text-secondary hover:bg-bg-hover hover:text-text-primary focus:ring-border-default',
    danger: 'bg-error text-text-primary hover:bg-error-muted focus:ring-error'
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const spinnerSize = size === 'lg' ? 'md' : 'sm';

  return (
    <button
      class={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${local.class ?? ''}`}
      disabled={local.disabled || local.loading}
      {...rest}
    >
      <Show when={local.loading}>
        <Spinner size={spinnerSize} />
      </Show>
      {local.children}
    </button>
  );
};
