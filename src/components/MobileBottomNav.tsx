import React from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import { NAV_ITEMS } from './Header';

interface MobileBottomNavProps {
  savedScreensCount?: number;
}

/** The same four destinations as the header, as plain words along the bottom edge. */
export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ savedScreensCount = 0 }) => {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Main"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-apple-bg border-t border-apple-border pb-safe select-none"
    >
      <div className="grid grid-cols-4 h-12">
        {NAV_ITEMS.map((item) => {
          const active = item.match(pathname);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              aria-current={active ? 'page' : undefined}
              className={`relative flex items-center justify-center text-caption1 transition-colors ${
                active ? 'text-apple-primary font-semibold' : 'text-apple-muted'
              }`}
            >
              {item.label === 'Super-investors' ? 'Investors' : item.label}
              {item.to === '/saved' && savedScreensCount > 0 && (
                <span className="ml-1 num text-apple-faint font-normal">{savedScreensCount}</span>
              )}
              {active && <span className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-apple-primary" />}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
