import { Component, JSX, splitProps } from 'solid-js';

export interface CardProps extends JSX.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated';
}

export const Card: Component<CardProps> = (props) => {
  const [local, rest] = splitProps(props, ['variant', 'class', 'children']);

  const variant = local.variant ?? 'default';

  const variantStyles = {
    default: 'bg-bg-secondary border border-border-default',
    elevated: 'bg-bg-elevated border border-border-default shadow-md'
  };

  return (
    <div
      class={`rounded-xl p-4 ${variantStyles[variant]} ${local.class ?? ''}`}
      {...rest}
    >
      {local.children}
    </div>
  );
};

export interface CardHeaderProps extends JSX.HTMLAttributes<HTMLDivElement> {}

export const CardHeader: Component<CardHeaderProps> = (props) => {
  const [local, rest] = splitProps(props, ['class', 'children']);

  return (
    <div class={`mb-4 ${local.class ?? ''}`} {...rest}>
      {local.children}
    </div>
  );
};

export interface CardTitleProps extends JSX.HTMLAttributes<HTMLHeadingElement> {}

export const CardTitle: Component<CardTitleProps> = (props) => {
  const [local, rest] = splitProps(props, ['class', 'children']);

  return (
    <h3 class={`text-lg font-semibold text-text-primary ${local.class ?? ''}`} {...rest}>
      {local.children}
    </h3>
  );
};

export interface CardDescriptionProps extends JSX.HTMLAttributes<HTMLParagraphElement> {}

export const CardDescription: Component<CardDescriptionProps> = (props) => {
  const [local, rest] = splitProps(props, ['class', 'children']);

  return (
    <p class={`text-sm text-text-secondary mt-1 ${local.class ?? ''}`} {...rest}>
      {local.children}
    </p>
  );
};

export interface CardContentProps extends JSX.HTMLAttributes<HTMLDivElement> {}

export const CardContent: Component<CardContentProps> = (props) => {
  const [local, rest] = splitProps(props, ['class', 'children']);

  return (
    <div class={local.class ?? ''} {...rest}>
      {local.children}
    </div>
  );
};

export interface CardFooterProps extends JSX.HTMLAttributes<HTMLDivElement> {}

export const CardFooter: Component<CardFooterProps> = (props) => {
  const [local, rest] = splitProps(props, ['class', 'children']);

  return (
    <div class={`mt-4 flex items-center gap-2 ${local.class ?? ''}`} {...rest}>
      {local.children}
    </div>
  );
};
