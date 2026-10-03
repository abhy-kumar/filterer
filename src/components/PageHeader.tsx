import React from 'react';

interface PageHeaderProps {
  title: string;
  children?: React.ReactNode;
  /** Sits on the right on wide screens, under the title on narrow ones. */
  aside?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, children, aside }) => (
  <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-apple-border">
    <div className="min-w-0">
      <h1 className="text-title2 sm:text-title1 text-apple-primary font-display">{title}</h1>
      {children && <div className="text-subheadline text-apple-secondary mt-1.5 max-w-2xl">{children}</div>}
    </div>
    {aside && <div className="flex items-center gap-3 flex-wrap shrink-0">{aside}</div>}
  </header>
);
