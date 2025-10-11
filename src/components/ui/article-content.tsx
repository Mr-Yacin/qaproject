import DOMPurify from 'isomorphic-dompurify';

/**
 * ArticleContent component
 * Renders HTML content with optimized image attributes for lazy loading
 * Requirements: 10.1, 10.5, 3.9 (HTML sanitization)
 */
interface ArticleContentProps {
  content: string;
  className?: string;
}

/**
 * Process HTML content to add lazy loading and optimization attributes to images
 */
function optimizeImageTags(html: string): string {
  // Add loading="lazy" and decoding="async" to all img tags
  return html.replace(
    /<img\s+([^>]*?)>/gi,
    (match, attrs) => {
      // Check if loading attribute already exists
      if (!/loading\s*=/i.test(attrs)) {
        attrs += ' loading="lazy"';
      }
      // Add decoding="async" for better performance
      if (!/decoding\s*=/i.test(attrs)) {
        attrs += ' decoding="async"';
      }
      // Add default styling for responsive images
      if (!/class\s*=/i.test(attrs)) {
        attrs += ' class="max-w-full h-auto rounded-lg"';
      } else {
        // Append to existing class
        attrs = attrs.replace(
          /class\s*=\s*["']([^"']*?)["']/i,
          'class="$1 max-w-full h-auto rounded-lg"'
        );
      }
      return `<img ${attrs}>`;
    }
  );
}

export function ArticleContent({ content, className = '' }: ArticleContentProps) {
  // Sanitize HTML content to prevent XSS attacks
  const sanitizedContent = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'strong', 'em', 'u', 's',
      'a', 'img',
      'ul', 'ol', 'li',
      'blockquote', 'code', 'pre',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span',
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel',
      'src', 'alt', 'title', 'width', 'height',
      'class', 'loading', 'decoding',
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  });

  const optimizedContent = optimizeImageTags(sanitizedContent);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: optimizedContent }}
    />
  );
}
