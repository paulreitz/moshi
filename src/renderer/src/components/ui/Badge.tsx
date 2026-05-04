import { Component, JSX, splitProps } from 'solid-js';

export interface BadgeProps extends JSX.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'jlpt-n5' | 'jlpt-n4' | 'jlpt-n3' | 'jlpt-n2' | 'jlpt-n1';
  size?: 'sm' | 'md';
}

export const Badge: Component<BadgeProps> = (props) => {
  const [local, rest] = splitProps(props, ['variant', 'size', 'class', 'children']);

  const variant = local.variant ?? 'default';
  const size = local.size ?? 'md';

  const variantStyles = {
    default: 'bg-bg-elevated text-text-secondary border border-border-default',
    success: 'bg-success/20 text-success border border-success/30',
    warning: 'bg-warning/20 text-warning border border-warning/30',
    error: 'bg-error/20 text-error border border-error/30',
    info: 'bg-info/20 text-info border border-info/30',
    'jlpt-n5': 'bg-jlpt-n5/20 text-jlpt-n5 border border-jlpt-n5/30',
    'jlpt-n4': 'bg-jlpt-n4/20 text-jlpt-n4 border border-jlpt-n4/30',
    'jlpt-n3': 'bg-jlpt-n3/20 text-jlpt-n3 border border-jlpt-n3/30',
    'jlpt-n2': 'bg-jlpt-n2/20 text-jlpt-n2 border border-jlpt-n2/30',
    'jlpt-n1': 'bg-jlpt-n1/20 text-jlpt-n1 border border-jlpt-n1/30'
  };

  const sizeStyles = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-xs'
  };

  return (
    <span
      class={`inline-flex items-center font-medium rounded-md ${variantStyles[variant]} ${sizeStyles[size]} ${local.class ?? ''}`}
      {...rest}
    >
      {local.children}
    </span>
  );
};
