import { Component, For } from 'solid-js';
import { Toast } from './Toast';
import { getToasts, removeToast } from '../../stores/toast';

export const Toaster: Component = () => {
  return (
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      <For each={getToasts()}>
        {(toast) => (
          <Toast
            message={toast.message}
            variant={toast.variant}
            onDismiss={() => removeToast(toast.id)}
          />
        )}
      </For>
    </div>
  );
};
