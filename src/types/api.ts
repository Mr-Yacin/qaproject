import { Topic, Question, Article, FAQItem, ContentStatus } from '@prisma/client';

// Ingest Payload Types
export interface IngestPayload {
  topic: {
    slug: string;
    title: string;
    locale: string;
    tags: string[];
    thumbnailUrl?: string;
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string[];
  };
  mainQuestion: {
    text: string;
  };
  article: {
    content: string;
    status: ContentStatus;
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string[];
  };
  faqItems: {
    question: string;
    answer: string;
    order: number;
  }[];
}

// Unified Topic Response Type
export interface UnifiedTopic {
  topic: Topic;
  primaryQuestion: Question | null;
  article: Article | null;
  faqItems: FAQItem[];
}

// Paginated Topics Response Type
export interface PaginatedTopics {
  items: UnifiedTopic[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Ingest Result Type
export interface IngestResult {
  success: boolean;
  topicId: string;
  jobId: string;
}

// Topic Filters Type
export interface TopicFilters {
  locale?: string;
  tag?: string;
  page: number;
  limit: number;
}

// Revalidate Payload Type
export interface RevalidatePayload {
  tag: string;
}
