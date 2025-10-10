'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navigation } from './Navigation';

interface MenuItem {
  id: string;
  label: string;
  url: string;
  isExternal: boolean;
  openNewTab: boolean;
  children?: MenuItem[];
}

interface HeaderProps {
  menuItems?: MenuItem[];
}

/**
 * Header Component
 * Main site header with dynamic navigation from database
 * Requirements: 4.1, 4.4, 4.7, 4.8
 */
export default function Header({ menuItems = [] }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-shadow duration-200 ${
        isScrolled ? 'bg-white shadow-md' : 'bg-white'
      }`}
      role="banner"
    >
      <nav 
        className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 md:py-4 lg:px-8"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5" aria-label="Q&A CMS Home">
            <span className="text-xl font-bold text-primary-600 md:text-2xl">
              Q&A CMS
            </span>
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </Button>
        </div>

        {/* Desktop navigation */}
        <div className="hidden md:block">
          <Navigation items={menuItems} />
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <nav 
          id="mobile-menu"
          className="md:hidden"
          aria-label="Mobile navigation"
        >
          <div className="border-t border-gray-200 px-4 pb-3 pt-2">
            <Navigation
              items={menuItems}
              isMobile
              onItemClick={() => setMobileMenuOpen(false)}
            />
          </div>
        </nav>
      )}
    </header>
  );
}
