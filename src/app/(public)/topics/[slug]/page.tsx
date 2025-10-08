import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTopicBySlug } from '@/lib/api/topics';
import { 
  generateTopicMetadata, 
  generateArticleSchema, 
  generateFAQSchema,
  generateBreadcrumbSchema 
} from '@/lib/utils/seo';
import FAQAccordion from '@/components/public/FAQAccordion';
import BackToTop from '@/components/public/BackToTop';

interface TopicPageProps {
  params: {
    slug: string;
  };
}

// Generate metadata for SEO with comprehensive Open Graph and Twitter card tags
export async function generateMetadata({ params }: TopicPageProps): Promise<Metadata> {
  try {
    const data = await getTopicBySlug(params.slug);
    return generateTopicMetadata(data);
  } catch {
    return {
      title: 'Topic Not Found',
    };
  }
}

export default async function TopicPage({ params }: TopicPageProps) {
  let data;
  
  try {
    data = await getTopicBySlug(params.slug);
  } catch {
    notFound();
  }

  const { topic, primaryQuestion, article, faqItems } = data;

  // Filter and sort FAQ items
  const sortedFaqItems = faqItems
    .filter(item => item.question && item.answer)
    .sort((a, b) => a.order - b.order);

  // Generate structured data schemas
  const articleSchema = generateArticleSchema(data);
  const faqSchema = generateFAQSchema(sortedFaqItems);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000' },
    { name: 'Topics', url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/topics` },
    { name: topic.title, url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/topics/${topic.slug}` },
  ]);

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="py-8 md:py-12">
      {/* Topic Header */}
      <header className="mb-8 md:mb-12">
        <div className="mb-4">
          {/* Tags */}
          {topic.tags && topic.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {topic.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4">
            {topic.title}
          </h1>

          {/* Main Question */}
          {primaryQuestion && (
            <p className="text-xl md:text-2xl text-gray-700 leading-relaxed">
              {primaryQuestion.text}
            </p>
          )}
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
          <time dateTime={topic.updatedAt.toString()}>
            Updated: {new Date(topic.updatedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
          <span className="inline-flex items-center">
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
              />
            </svg>
            {topic.locale.toUpperCase()}
          </span>
        </div>
      </header>

      {/* Article Content */}
      {article && article.content && (
        <article className="mb-12 md:mb-16">
          <div 
            className="prose prose-lg md:prose-xl max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-ul:list-disc prose-ol:list-decimal"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </article>
      )}

      {/* FAQ Section */}
      {sortedFaqItems.length > 0 && (
        <section className="mb-12 md:mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            Frequently Asked Questions
          </h2>
          <FAQAccordion items={sortedFaqItems} />
        </section>
      )}

      {/* Back to Top Button */}
      <BackToTop />
      </div>
    </>
  );
}
