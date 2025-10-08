'use client';

import { FAQItem } from '@prisma/client';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface FAQAccordionProps {
  items: FAQItem[];
}

/**
 * FAQAccordion component displays FAQ items in an accessible accordion format
 * Features:
 * - Expand/collapse functionality
 * - Smooth animations
 * - Keyboard navigation (built into Radix UI)
 * - ARIA attributes for accessibility
 * 
 * Requirements: 1.3, 8.4
 */
export default function FAQAccordion({ items }: FAQAccordionProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <Accordion 
      type="single" 
      collapsible 
      className="w-full space-y-2"
    >
      {items.map((item, index) => (
        <AccordionItem
          key={item.id}
          value={`item-${index}`}
          className="border border-gray-200 rounded-lg px-6 bg-white shadow-sm hover:shadow-md transition-shadow"
        >
          <AccordionTrigger 
            className="text-left text-base md:text-lg font-semibold text-gray-900 hover:text-primary-600 py-4"
            aria-label={`Toggle answer for: ${item.question}`}
          >
            {item.question}
          </AccordionTrigger>
          <AccordionContent 
            className="text-gray-700 leading-relaxed pb-4"
            role="region"
            aria-label={`Answer for: ${item.question}`}
          >
            <div 
              className="prose prose-sm md:prose-base max-w-none"
              dangerouslySetInnerHTML={{ __html: item.answer }}
            />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
