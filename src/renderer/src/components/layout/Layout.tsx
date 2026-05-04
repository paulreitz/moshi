import { Component, JSX, onMount, onCleanup } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { Sidebar } from './Sidebar';
import { Toaster } from '../ui';
import type { AppEvent } from '../../../../shared/types';

export interface LayoutProps {
  children?: JSX.Element;
}

export const Layout: Component<LayoutProps> = (props) => {
  return (
    <div class="flex h-screen bg-bg-primary">
      <Sidebar />
      <main class="flex-1 overflow-auto">
        <div class="p-6">
          {props.children}
        </div>
      </main>
      <Toaster />
    </div>
  );
};

export const LayoutWithNavigation: Component<LayoutProps> = (props) => {
  const navigate = useNavigate();

  onMount(() => {
    const unsubscribe = window.api.events.onAppEvent((event: AppEvent) => {
      if (event.type === 'navigate') {
        navigate(event.path);
      }
    });

    onCleanup(() => {
      unsubscribe();
    });
  });

  return <Layout>{props.children}</Layout>;
};
