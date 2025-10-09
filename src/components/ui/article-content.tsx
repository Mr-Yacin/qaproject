/**
 * ArticleContent component
 * Renders HTML content with optimized image attributes for lazy loading
 * Requirements: 10.1, 10.5
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
  const optimizedContent = optimizeImageTags(content);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: optimizedContent }}
    />
  );
}
