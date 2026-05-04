import { Component, JSX, splitProps, For } from 'solid-js';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<JSX.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select: Component<SelectProps> = (props) => {
  const [local, rest] = splitProps(props, ['label', 'error', 'options', 'placeholder', 'class', 'id']);

  const selectId = local.id ?? `select-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <div class="flex flex-col gap-1.5">
      {local.label && (
        <label for={selectId} class="text-sm font-medium text-text-secondary">
          {local.label}
        </label>
      )}
      <select
        id={selectId}
        class={`
          w-full px-3 py-2 rounded-lg appearance-none
          bg-bg-elevated border border-border-default
          text-text-primary
          focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary
          disabled:opacity-50 disabled:cursor-not-allowed
          ${local.error ? 'border-error focus:border-error focus:ring-error' : ''}
          ${local.class ?? ''}
        `}
        style={{
          'background-image': `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23a0a0b0' d='M2 4l4 4 4-4'/%3E%3C/svg%3E")`,
          'background-repeat': 'no-repeat',
          'background-position': 'right 12px center'
        }}
        {...rest}
      >
        {local.placeholder && (
          <option value="" disabled>
            {local.placeholder}
          </option>
        )}
        <For each={local.options}>
          {(option) => (
            <option value={option.value}>{option.label}</option>
          )}
        </For>
      </select>
      {local.error && (
        <span class="text-sm text-error">{local.error}</span>
      )}
    </div>
  );
};
