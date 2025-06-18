import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function Header() {
  const location = useLocation();

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Therapy', href: '/therapy' },
    { name: 'Community', href: '/community' },
    { name: 'Tools', href: '/tools' },
    { name: 'Resources', href: '/resources' },
  ];

  return (
    <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            🌿 Grief Literacy
          </Link>
          
          <div className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-purple-600 dark:hover:text-purple-400",
                  location.pathname === item.href || location.pathname.startsWith(item.href + '/')
                    ? "text-purple-600 dark:text-purple-400"
                    : "text-gray-600 dark:text-gray-300"
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
}
