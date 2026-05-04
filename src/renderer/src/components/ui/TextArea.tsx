import { Component, JSX, splitProps } from 'solid-js';

export interface TextAreaProps extends JSX.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea: Component<TextAreaProps> = (props) => {
  const [local, rest] = splitProps(props, ['label', 'error', 'class', 'id']);

  const textareaId = local.id ?? `textarea-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <div class="flex flex-col gap-1.5">
      {local.label && (
        <label for={textareaId} class="text-sm font-medium text-text-secondary">
          {local.label}
        </label>
      )}
      <textarea
        id={textareaId}
        class={`
          w-full px-3 py-2 rounded-lg resize-y min-h-[100px]
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
