import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Compass, SlidersHorizontal, Bookmark, Users, Activity } from 'lucide-react';

interface MobileBottomNavProps {
  savedScreensCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ savedScreensCount = 0 }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const currentTab = location.pathname === '/'
    ? 'screens'
    : location.pathname.startsWith('/screen')
      ? 'query'
      : location.pathname === '/saved' || location.pathname === '/watchlists'
        ? 'saved'
        : location.pathname.startsWith('/people') || location.pathname.startsWith('/investors')
          ? 'people'
          : location.pathname.startsWith('/commodities')
            ? 'commodities'
            : '';

  const navItems = [
    {
      id: 'screens',
      label: 'Screens',
      path: '/',
      icon: Compass,
    },
    {
      id: 'query',
      label: 'Query',
      path: '/screen',
      icon: SlidersHorizontal,
    },
    {
      id: 'saved',
      label: 'Watchlists',
      path: '/saved',
      icon: Bookmark,
      badge: savedScreensCount > 0 ? savedScreensCount : undefined,
    },
    {
      id: 'people',
      label: 'Investors',
      path: '/people',
      icon: Users,
    },
    {
      id: 'commodities',
      label: 'Commodities',
      path: '/commodities',
      icon: Activity,
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-apple-card/95 backdrop-blur-xl border-t border-apple-border pb-safe select-none shadow-[0_-4px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.4)]"
    >
      <div className="grid grid-cols-5 h-14 items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center h-full w-full relative transition-colors ${
                isActive
                  ? 'text-apple-blue font-semibold'
                  : 'text-apple-muted hover:text-apple-primary active:scale-95'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-2.5 bg-apple-blue text-white text-caption2 font-bold num px-1 min-w-[14px] h-[14px] rounded-full flex items-center justify-center leading-none">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-caption2 mt-1 leading-tight tracking-tight ${isActive ? 'font-semibold' : 'font-normal'}`}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-apple-blue" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
