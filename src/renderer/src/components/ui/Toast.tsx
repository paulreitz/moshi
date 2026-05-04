import { Component, Show } from 'solid-js';
import type { ToastVariant } from '../../stores/toast';

export interface ToastProps {
  message: string;
  variant: ToastVariant;
  onDismiss: () => void;
}

export const Toast: Component<ToastProps> = (props) => {
  const variantStyles: Record<ToastVariant, string> = {
    success: 'bg-success/10 border-success text-success',
    error: 'bg-error/10 border-error text-error',
    warning: 'bg-warning/10 border-warning text-warning',
    info: 'bg-info/10 border-info text-info'
  };

  const icons: Record<ToastVariant, string> = {
    success: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    error: 'M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    warning: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
    info: 'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z'
  };

  return (
    <div
      class={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${variantStyles[props.variant]}`}
      role="alert"
    >
      <svg
        class="w-5 h-5 flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d={icons[props.variant]}
        />
      </svg>
      <span class="flex-1 text-sm font-medium text-text-primary">
        {props.message}
      </span>
      <button
        type="button"
        class="flex-shrink-0 p-1 rounded hover:bg-bg-hover transition-colors"
        onClick={props.onDismiss}
        aria-label="Dismiss"
      >
        <svg
          class="w-4 h-4 text-text-secondary"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="2"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
};
