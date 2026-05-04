import { Component, JSX, Show, createEffect, onCleanup } from 'solid-js';
import { Portal } from 'solid-js/web';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: JSX.Element;
  size?: 'sm' | 'md' | 'lg';
}

export const Modal: Component<ModalProps> = (props) => {
  const size = props.size ?? 'md';

  const sizeStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg'
  };

  // Close on escape key
  createEffect(() => {
    if (!props.isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        props.onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    onCleanup(() => document.removeEventListener('keydown', handleKeyDown));
  });

  // Prevent body scroll when modal is open
  createEffect(() => {
    if (props.isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    onCleanup(() => {
      document.body.style.overflow = '';
    });
  });

  return (
    <Show when={props.isOpen}>
      <Portal>
        <div class="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            class="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={props.onClose}
          />

          {/* Modal content */}
          <div
            class={`
              relative z-10 w-full ${sizeStyles[size]} mx-4
              bg-bg-secondary border border-border-default rounded-xl
              shadow-lg animate-in fade-in zoom-in-95 duration-200
            `}
          >
            {/* Header */}
            <Show when={props.title}>
              <div class="flex items-center justify-between px-6 py-4 border-b border-border-default">
                <h2 class="text-lg font-semibold text-text-primary">
                  {props.title}
                </h2>
                <button
                  onClick={props.onClose}
                  class="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </Show>

            {/* Body */}
            <div class="px-6 py-4">
              {props.children}
            </div>
          </div>
        </div>
      </Portal>
    </Show>
  );
};
