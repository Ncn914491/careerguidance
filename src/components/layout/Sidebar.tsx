'use client';


import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  CalendarDaysIcon, 
  UserGroupIcon, 
  UsersIcon, 
  AcademicCapIcon, 
  CogIcon,
  UserPlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigation: NavigationItem[] = [
  { name: 'Home', href: '/', icon: HomeIcon },
  { name: 'Weeks', href: '/weeks', icon: CalendarDaysIcon },
  { name: 'Groups', href: '/groups', icon: UserGroupIcon },
  { name: 'Team', href: '/team', icon: UsersIcon },
  { name: 'Schools', href: '/schools', icon: AcademicCapIcon },
  { name: 'Request Admin', href: '/request-admin', icon: UserPlusIcon },
  { name: 'Admin', href: '/admin', icon: CogIcon },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobileOpen: boolean;
  onMobileToggle: () => void;
}

export default function Sidebar({ isCollapsed, onToggle, isMobileOpen, onMobileToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={onMobileToggle}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-glass backdrop-blur-md border border-glass shadow-glass text-white hover:bg-glass-dark transition-all duration-300 transform hover:scale-110 active:scale-95"
        aria-label="Toggle mobile menu"
      >
        <Bars3Icon className="w-6 h-6" />
      </button>

      {/* Sidebar */}
      <div
        className={`
          fixed left-0 top-0 h-full z-40 transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-16' : 'w-64'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          bg-glass backdrop-blur-md border-r border-glass shadow-glass-lg
        `}
      >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-glass">
        {!isCollapsed && (
          <h1 className="text-lg font-semibold text-white truncate">
            Career Guidance
          </h1>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-glass-dark transition-all duration-300 text-white transform hover:scale-110 active:scale-95"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRightIcon className="w-5 h-5" />
          ) : (
            <ChevronLeftIcon className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="mt-4 px-2">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center px-3 py-2 rounded-lg transition-all duration-300 group
                    ${isActive 
                      ? 'bg-glass-light border border-glass text-white shadow-glass-sm' 
                      : 'text-gray-300 hover:bg-glass-dark hover:text-white hover:shadow-glass-sm transform hover:scale-105'
                    }
                    ${isCollapsed ? 'justify-center' : 'justify-start'}
                  `}
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
                  {!isCollapsed && (
                    <span className="ml-3 text-sm font-medium truncate transition-all duration-300">
                      {item.name}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="p-3 rounded-lg bg-glass-light border border-glass">
            <p className="text-xs text-gray-400 text-center">
              Career Guidance Project
            </p>
            <p className="text-xs text-gray-500 text-center mt-1">
              v1.0.0
            </p>
          </div>
        </div>
      )}
      </div>
    </>
  );
}