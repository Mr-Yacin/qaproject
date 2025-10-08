'use client';

import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

/**
 * BackToTop component displays a button that appears when user scrolls down
 * and smoothly scrolls back to the top when clicked
 * 
 * Features:
 * - Appears after scrolling 300px down
 * - Smooth scroll animation
 * - Mobile-friendly with proper touch target size (44x44px minimum)
 * - Accessible with ARIA labels
 * 
 * Requirements: 1.8, 7.4
 */
export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button when page is scrolled down 300px
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    // Add scroll event listener
    window.addEventListener('scroll', toggleVisibility);

    // Cleanup
    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-300 hover:scale-110 active:scale-95"
          aria-label="Scroll back to top"
          title="Back to top"
        >
          <ArrowUp className="w-5 h-5 md:w-6 md:h-6" aria-hidden="true" />
        </button>
      )}
    </>
  );
}
