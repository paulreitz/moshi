import { Component, splitProps } from 'solid-js';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  class?: string;
}

export const Toggle: Component<ToggleProps> = (props) => {
  const [local] = splitProps(props, ['checked', 'onChange', 'label', 'disabled', 'class']);

  return (
    <label class={`inline-flex items-center gap-3 cursor-pointer ${local.disabled ? 'opacity-50 cursor-not-allowed' : ''} ${local.class ?? ''}`}>
      <button
        type="button"
        role="switch"
        aria-checked={local.checked}
        disabled={local.disabled}
        onClick={() => !local.disabled && local.onChange(!local.checked)}
        class={`
          relative inline-flex h-6 w-11 shrink-0 rounded-full
          transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 focus:ring-offset-bg-primary
          ${local.checked ? 'bg-accent-primary' : 'bg-bg-hover border border-border-default'}
        `}
      >
        <span
          class={`
            pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md
            transform transition-transform duration-200 ease-in-out
            ${local.checked ? 'translate-x-5' : 'translate-x-0.5'}
            mt-0.5
          `}
        />
      </button>
      {local.label && (
        <span class="text-sm text-text-primary">{local.label}</span>
      )}
    </label>
  );
};
