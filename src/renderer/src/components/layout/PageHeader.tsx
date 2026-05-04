import { Component, JSX } from 'solid-js';

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: JSX.Element;
}

export const PageHeader: Component<PageHeaderProps> = (props) => {
  return (
    <div class="flex items-start justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-text-primary">{props.title}</h1>
        {props.description && (
          <p class="mt-1 text-text-secondary">{props.description}</p>
        )}
      </div>
      {props.actions && (
        <div class="flex items-center gap-2">
          {props.actions}
        </div>
      )}
    </div>
  );
};
