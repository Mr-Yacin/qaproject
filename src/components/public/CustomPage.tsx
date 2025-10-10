import DOMPurify from 'isomorphic-dompurify';

interface CustomPageProps {
  page: {
    title: string;
    content: string;
    seoTitle?: string | null;
    seoDescription?: string | null;
    seoKeywords?: string[];
  };
}

/**
 * Custom Page Component
 * Renders a custom page with sanitized HTML content
 * Requirements: 3.3, 3.5, 3.6, 3.9
 */
export function CustomPage({ page }: CustomPageProps) {
  // Sanitize HTML content to prevent XSS attacks
  const sanitizedContent = DOMPurify.sanitize(page.content, {
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
      'class',
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <article className="prose prose-lg max-w-none">
        <h1 className="text-4xl font-bold mb-6">{page.title}</h1>
        <div
          className="prose-headings:font-semibold prose-a:text-primary prose-a:underline prose-img:rounded-lg"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />
      </article>
    </div>
  );
}
