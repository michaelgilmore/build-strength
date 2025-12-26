import { NavLink, useLocation } from 'react-router-dom';
import { Dumbbell, Plus, Calendar, ClipboardList, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: Dumbbell, label: 'Workout' },
  { to: '/exercises', icon: Plus, label: 'Exercises' },
  { to: '/routines', icon: Calendar, label: 'Routines' },
  { to: '/workout-log', icon: ClipboardList, label: 'Log' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('w-6 h-6 mb-1', isActive && 'text-primary')} />
              <span className="text-xs font-medium">{label}</span>
              {isActive && (
                <div className="absolute bottom-0 w-12 h-0.5 bg-primary rounded-t-full" />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
