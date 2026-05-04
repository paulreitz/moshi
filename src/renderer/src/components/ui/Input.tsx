import { Component, JSX, splitProps } from 'solid-js';

export interface InputProps extends JSX.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: Component<InputProps> = (props) => {
  const [local, rest] = splitProps(props, ['label', 'error', 'class', 'id']);

  const inputId = local.id ?? `input-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <div class="flex flex-col gap-1.5">
      {local.label && (
        <label for={inputId} class="text-sm font-medium text-text-secondary">
          {local.label}
        </label>
      )}
      <input
        id={inputId}
        class={`
          w-full px-3 py-2 rounded-lg
          bg-bg-elevated border border-border-default
          text-text-primary placeholder:text-text-muted
          focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary
          disabled:opacity-50 disabled:cursor-not-allowed
          ${local.error ? 'border-error focus:border-error focus:ring-error' : ''}
          ${local.class ?? ''}
        `}
        {...rest}
      />
      {local.error && (
        <span class="text-sm text-error">{local.error}</span>
      )}
    </div>
  );
};
