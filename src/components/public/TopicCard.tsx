import Link from 'next/link';
import { UnifiedTopic } from '@/types/api';

interface TopicCardProps {
  topic: UnifiedTopic;
  variant?: 'default' | 'featured';
}

/**
 * TopicCard component for displaying topic previews
 * Requirements: 1.2, 7.1, 7.2, 7.3, 8.2, 8.3
 */
export default function TopicCard({ topic, variant = 'default' }: TopicCardProps) {
  const isFeatured = variant === 'featured';
  
  return (
    <article className="group h-full" role="listitem">
      <Link 
        href={`/topics/${topic.topic.slug}`}
        className="block h-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg"
        aria-label={`Read article: ${topic.topic.title}`}
      >
        <div 
          className={`
            h-full rounded-lg border bg-white shadow-sm 
            transition-all duration-300
            hover:shadow-lg hover:border-primary-300 hover:-translate-y-1
            ${isFeatured ? 'border-primary-200' : 'border-gray-200'}
            p-6
          `}
        >
          {/* Title */}
          <h3 
            className={`
              font-semibold text-gray-900 
              group-hover:text-primary-600 
              transition-colors
              ${isFeatured ? 'text-2xl' : 'text-xl'}
            `}
          >
            {topic.topic.title}
          </h3>
          
          {/* Tags */}
          {topic.topic.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2" role="list" aria-label="Topic tags">
              {topic.topic.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  role="listitem"
                  className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700"
                >
                  {tag}
                </span>
              ))}
              {topic.topic.tags.length > 3 && (
                <span 
                  role="listitem"
                  className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
                  aria-label={`${topic.topic.tags.length - 3} more tags`}
                >
                  +{topic.topic.tags.length - 3} more
                </span>
              )}
            </div>
          )}
          
          {/* Date */}
          <div className="mt-4 flex items-center text-sm text-gray-500">
            <time dateTime={new Date(topic.topic.updatedAt).toISOString()}>
              Updated {new Date(topic.topic.updatedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </time>
          </div>
          
          {/* Locale Badge */}
          <div className="mt-3">
            <span 
              className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600"
              aria-label={`Language: ${topic.topic.locale.toUpperCase()}`}
            >
              {topic.topic.locale.toUpperCase()}
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
