import { getTopics } from '@/lib/api/topics';
import SearchBar from '@/components/public/SearchBar';
import TopicCard from '@/components/public/TopicCard';
import Link from 'next/link';

/**
 * Homepage with hero section and featured topics
 * Requirements: 1.1, 9.1
 */
export default async function HomePage() {
  // Fetch featured topics (first 6 topics)
  const topicsData = await getTopics({ limit: 6, page: 1 });

  return (
    <div className="py-12 md:py-16 lg:py-20">
      {/* Hero Section */}
      <div className="text-center mb-12 md:mb-16">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
          Welcome to Q&A CMS
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
          Browse our collection of articles and find answers to your questions.
        </p>
        
        {/* Search Bar */}
        <div className="mt-8 flex justify-center">
          <SearchBar placeholder="Search for topics..." variant="page" />
        </div>
      </div>

      {/* Featured Topics Section */}
      {topicsData.items.length > 0 && (
        <div className="mt-12 md:mt-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Featured Topics</h2>
            <Link 
              href="/topics"
              className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              View all →
            </Link>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {topicsData.items.map((item) => (
              <TopicCard key={item.topic.id} topic={item} variant="default" />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {topicsData.items.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No topics available yet.</p>
        </div>
      )}
    </div>
  );
}
