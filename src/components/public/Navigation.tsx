'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ExternalLink } from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  url: string;
  isExternal: boolean;
  openNewTab: boolean;
  children?: MenuItem[];
}

interface NavigationProps {
  items: MenuItem[];
  isMobile?: boolean;
  onItemClick?: () => void;
}

/**
 * Dynamic Navigation Component
 * Renders navigation menu from database with support for nested menus
 * Requirements: 4.1, 4.4, 4.7, 4.8
 */
export function Navigation({ items, isMobile = false, onItemClick }: NavigationProps) {
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set());

  const toggleDropdown = (id: string) => {
    const newOpenDropdowns = new Set(openDropdowns);
    if (newOpenDropdowns.has(id)) {
      newOpenDropdowns.delete(id);
    } else {
      newOpenDropdowns.add(id);
    }
    setOpenDropdowns(newOpenDropdowns);
  };

  const handleItemClick = () => {
    if (onItemClick) {
      onItemClick();
    }
  };

  const renderDesktopMenuItem = (item: MenuItem) => {
    const hasChildren = item.children && item.children.length > 0;
    const isOpen = openDropdowns.has(item.id);

    if (hasChildren) {
      return (
        <li key={item.id} className="relative group">
          <button
            onClick={() => toggleDropdown(item.id)}
            className="flex items-center gap-1 text-sm font-semibold leading-6 text-gray-900 transition-all duration-200 hover:text-primary-600 hover:scale-105 relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary-600 after:transition-all after:duration-200 hover:after:w-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded px-1"
          >
            {item.label}
            <ChevronDown className="h-4 w-4" />
          </button>

          {/* Dropdown menu */}
          <ul
            className={`absolute left-0 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 transition-all duration-200 ${
              isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
            }`}
            role="list"
          >
            {item.children!.map((child) => (
              <li key={child.id}>
                {child.isExternal ? (
                  <a
                    href={child.url}
                    target={child.openNewTab ? '_blank' : undefined}
                    rel={child.openNewTab ? 'noopener noreferrer' : undefined}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-primary-600"
                    onClick={handleItemClick}
                  >
                    {child.label}
                    {child.isExternal && <ExternalLink className="h-3 w-3" />}
                  </a>
                ) : (
                  <Link
                    href={child.url}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-primary-600"
                    onClick={handleItemClick}
                  >
                    {child.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </li>
      );
    }

    return (
      <li key={item.id}>
        {item.isExternal ? (
          <a
            href={item.url}
            target={item.openNewTab ? '_blank' : undefined}
            rel={item.openNewTab ? 'noopener noreferrer' : undefined}
            className="flex items-center gap-1 text-sm font-semibold leading-6 text-gray-900 transition-all duration-200 hover:text-primary-600 hover:scale-105 relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary-600 after:transition-all after:duration-200 hover:after:w-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded px-1"
            onClick={handleItemClick}
          >
            {item.label}
            {item.isExternal && <ExternalLink className="h-3 w-3" />}
          </a>
        ) : (
          <Link
            href={item.url}
            className="text-sm font-semibold leading-6 text-gray-900 transition-all duration-200 hover:text-primary-600 hover:scale-105 relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary-600 after:transition-all after:duration-200 hover:after:w-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded px-1"
            onClick={handleItemClick}
          >
            {item.label}
          </Link>
        )}
      </li>
    );
  };

  const renderMobileMenuItem = (item: MenuItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isOpen = openDropdowns.has(item.id);

    return (
      <li key={item.id}>
        {hasChildren ? (
          <>
            <button
              onClick={() => toggleDropdown(item.id)}
              className={`flex items-center justify-between w-full rounded-md px-4 py-3 text-base font-medium text-gray-900 transition-colors hover:bg-gray-50 hover:text-primary-600 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset ${
                level > 0 ? 'pl-8' : ''
              }`}
            >
              {item.label}
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {isOpen && (
              <ul className="space-y-1" role="list">
                {item.children!.map((child) => renderMobileMenuItem(child, level + 1))}
              </ul>
            )}
          </>
        ) : (
          <>
            {item.isExternal ? (
              <a
                href={item.url}
                target={item.openNewTab ? '_blank' : undefined}
                rel={item.openNewTab ? 'noopener noreferrer' : undefined}
                className={`flex items-center gap-2 rounded-md px-4 py-3 text-base font-medium text-gray-900 transition-colors hover:bg-gray-50 hover:text-primary-600 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset ${
                  level > 0 ? 'pl-8' : ''
                }`}
                onClick={handleItemClick}
              >
                {item.label}
                {item.isExternal && <ExternalLink className="h-3 w-3" />}
              </a>
            ) : (
              <Link
                href={item.url}
                className={`block rounded-md px-4 py-3 text-base font-medium text-gray-900 transition-colors hover:bg-gray-50 hover:text-primary-600 min-h-[44px] flex items-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset ${
                  level > 0 ? 'pl-8' : ''
                }`}
                onClick={handleItemClick}
              >
                {item.label}
              </Link>
            )}
          </>
        )}
      </li>
    );
  };

  if (isMobile) {
    return (
      <ul className="space-y-1" role="list">
        {items.map((item) => renderMobileMenuItem(item))}
      </ul>
    );
  }

  return (
    <ul className="flex gap-x-8" role="list">
      {items.map((item) => renderDesktopMenuItem(item))}
    </ul>
  );
}
