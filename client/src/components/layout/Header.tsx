import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';

export function Header() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Therapy', href: '/therapy' },
    { name: 'Community', href: '/community' },
    { name: 'Tools', href: '/tools' },
    { name: 'Resources', href: '/resources' },
  ];

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  // Lock body scroll when menu is open
  React.useEffect(() => {
    if (mobileMenuOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [mobileMenuOpen]);

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [mobileMenuOpen]);

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100 shadow-sm">
        <nav className="container mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <img 
                  src="/mandala.png" 
                  alt="Logo" 
                  className="h-10 w-10 md:h-12 md:w-12 rounded-full shadow-md group-hover:shadow-lg transition-shadow duration-300" 
                />
              </div>
              <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Grief Literacy
              </span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
                    isActive(item.href)
                      ? "bg-purple-100 text-purple-700 shadow-sm"
                      : "text-gray-700 hover:bg-gray-100 hover:text-purple-600"
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-full hover:bg-gray-100 transition-colors duration-300"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-700" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700" />
              )}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu Overlay - Rendered via Portal */}
      {mobileMenuOpen && createPortal(
        <div 
          className="fixed inset-0 z-[10000] md:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-menu-title"
        >
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={closeMenu}
            aria-hidden="true"
          />
          
          {/* Menu Panel - Slide in from left */}
          <div 
            className="fixed inset-y-0 left-0 w-[280px] max-w-[85vw] bg-white shadow-2xl transform transition-transform duration-300 ease-out"
            style={{
              transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
              paddingTop: 'env(safe-area-inset-top, 0)',
              paddingBottom: 'env(safe-area-inset-bottom, 0)',
              paddingLeft: 'env(safe-area-inset-left, 0)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 id="mobile-menu-title" className="text-lg font-semibold text-gray-900">
                Navigation
              </h2>
              <button
                onClick={closeMenu}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {/* Menu Items */}
            <nav className="flex-1 overflow-y-auto py-4">
              <div className="px-4 space-y-1">
                {navigation.map((item, index) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={closeMenu}
                    className={cn(
                      "flex items-center px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 hover:bg-gray-50",
                      "min-h-[48px] touch-manipulation", // Touch-friendly sizing
                      isActive(item.href)
                        ? "bg-purple-50 text-purple-700 border border-purple-200"
                        : "text-gray-700 hover:text-purple-600"
                    )}
                    style={{
                      animationDelay: `${index * 50}ms`,
                      animation: mobileMenuOpen ? 'slideInItem 0.3s ease-out forwards' : 'none'
                    }}
                  >
                    <span className="flex-1">{item.name}</span>
                    {isActive(item.href) && (
                      <div className="w-2 h-2 bg-purple-500 rounded-full ml-2" />
                    )}
                  </Link>
                ))}
              </div>
            </nav>
            
            {/* Menu Footer */}
            <div className="border-t border-gray-200 p-4">
              <p className="text-sm text-gray-500 text-center">
                Grief Literacy Platform
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        @keyframes slideInItem {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        /* Ensure menu appears above all content */
        .fixed.z-\[10000\] {
          z-index: 10000 !important;
        }
        
        /* Prevent horizontal scroll on small screens */
        @media (max-width: 767px) {
          body {
            overflow-x: hidden;
          }
        }
      `}</style>
    </>
  );
}
