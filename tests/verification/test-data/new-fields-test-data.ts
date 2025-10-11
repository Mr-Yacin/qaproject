/**
 * Test data for new field integration validation
 * Covers SEO fields, thumbnail URLs, and mixed null/populated scenarios
 */

import { TopicTestData, ArticleTestData, FAQItemTestData } from '../types';

/**
 * Complete test topics with all new SEO fields populated
 */
export const topicsWithCompleteFields: TopicTestData[] = [
  {
    slug: 'complete-seo-topic-1',
    title: 'Complete SEO Topic Example',
    locale: 'en',
    tags: ['seo', 'complete', 'test'],
    thumbnailUrl: 'https://example.com/images/complete-seo-topic.jpg',
    seoTitle: 'Complete SEO Topic - Best Practices Guide',
    seoDescription: 'A comprehensive guide covering all aspects of SEO optimization with practical examples and actionable insights.',
    seoKeywords: ['seo', 'optimization', 'guide', 'best practices', 'search engine'],
    mainQuestion: 'What are the best SEO practices for content optimization?',
    article: {
      content: '<h1>Complete SEO Guide</h1><p>This article covers comprehensive SEO strategies...</p>',
      status: 'PUBLISHED',
      seoTitle: 'Article: Complete SEO Optimization Guide',
      seoDescription: 'Detailed article explaining SEO optimization techniques with step-by-step instructions.',
      seoKeywords: ['seo guide', 'content optimization', 'search ranking', 'meta tags']
    },
    faqItems: [
      {
        question: 'What is SEO?',
        answer: 'SEO stands for Search Engine Optimization, the practice of optimizing content for search engines.',
        order: 1
      },
      {
        question: 'How important are meta descriptions?',
        answer: 'Meta descriptions are crucial for click-through rates and provide search engines with content summaries.',
        order: 2
      }
    ]
  },
  {
    slug: 'multimedia-content-topic',
    title: 'Multimedia Content Strategy',
    locale: 'en',
    tags: ['multimedia', 'content', 'strategy'],
    thumbnailUrl: 'https://example.com/images/multimedia-strategy.png',
    seoTitle: 'Multimedia Content Strategy - Visual Engagement Guide',
    seoDescription: 'Learn how to create engaging multimedia content that drives user engagement and improves SEO performance.',
    seoKeywords: ['multimedia', 'content strategy', 'visual content', 'engagement', 'video marketing'],
    mainQuestion: 'How can multimedia content improve user engagement?',
    article: {
      content: '<h1>Multimedia Strategy</h1><p>Visual content is essential for modern digital marketing...</p>',
      status: 'PUBLISHED',
      seoTitle: 'Article: Effective Multimedia Content Creation',
      seoDescription: 'Comprehensive guide to creating and optimizing multimedia content for maximum impact.',
      seoKeywords: ['multimedia creation', 'visual storytelling', 'content marketing', 'user engagement']
    },
    faqItems: [
      {
        question: 'What types of multimedia content work best?',
        answer: 'Videos, infographics, interactive content, and high-quality images tend to perform well.',
        order: 1
      },
      {
        question: 'How do you optimize images for SEO?',
        answer: 'Use descriptive filenames, alt text, appropriate file sizes, and structured data markup.',
        order: 2
      }
    ]
  }
];

/**
 * Test topics with mixed null/populated new fields
 */
export const topicsWithMixedFields: TopicTestData[] = [
  {
    slug: 'partial-seo-topic-1',
    title: 'Partial SEO Fields Topic',
    locale: 'en',
    tags: ['partial', 'seo', 'test'],
    thumbnailUrl: 'https://example.com/images/partial-topic.jpg',
    seoTitle: 'Partial SEO Topic Title',
    seoDescription: null as any, // Intentionally null
    seoKeywords: ['partial', 'seo'], // Some keywords present
    mainQuestion: 'How do partial SEO fields affect performance?',
    article: {
      content: '<h1>Partial SEO Content</h1><p>This content has some SEO fields populated...</p>',
      status: 'PUBLISHED',
      seoTitle: null as any, // Article SEO title is null
      seoDescription: 'Article has description but topic does not',
      seoKeywords: [] // Empty array
    },
    faqItems: [
      {
        question: 'What happens with partial SEO data?',
        answer: 'Systems should gracefully handle null and empty SEO fields.',
        order: 1
      }
    ]
  },
  {
    slug: 'no-thumbnail-topic',
    title: 'Topic Without Thumbnail',
    locale: 'en',
    tags: ['no-thumbnail', 'test'],
    thumbnailUrl: null as any, // No thumbnail
    seoTitle: 'Topic Without Thumbnail Image',
    seoDescription: 'This topic demonstrates handling of null thumbnail URLs.',
    seoKeywords: ['no thumbnail', 'null handling', 'graceful degradation'],
    mainQuestion: 'How should systems handle missing thumbnails?',
    article: {
      content: '<h1>No Thumbnail Content</h1><p>Content without associated thumbnail image...</p>',
      status: 'PUBLISHED',
      seoTitle: 'Article: Handling Missing Media',
      seoDescription: null as any, // Article description is null
      seoKeywords: ['missing media', 'null handling']
    },
    faqItems: [
      {
        question: 'What is the fallback for missing thumbnails?',
        answer: 'Systems should provide default images or gracefully omit the thumbnail field.',
        order: 1
      }
    ]
  },
  {
    slug: 'empty-seo-fields-topic',
    title: 'Topic with Empty SEO Fields',
    locale: 'en',
    tags: ['empty', 'seo', 'fields'],
    thumbnailUrl: '', // Empty string instead of null
    seoTitle: '', // Empty string
    seoDescription: '', // Empty string
    seoKeywords: [], // Empty array
    mainQuestion: 'How are empty SEO fields handled differently from null?',
    article: {
      content: '<h1>Empty SEO Fields</h1><p>Testing empty string vs null handling...</p>',
      status: 'DRAFT', // Draft status
      seoTitle: '', // Empty string
      seoDescription: '', // Empty string
      seoKeywords: [] // Empty array
    },
    faqItems: [
      {
        question: 'What is the difference between null and empty string?',
        answer: 'Null indicates no value was set, while empty string indicates an intentionally empty value.',
        order: 1
      }
    ]
  }
];

/**
 * Test topics with only legacy fields (no new SEO fields)
 */
export const topicsWithLegacyFieldsOnly: TopicTestData[] = [
  {
    slug: 'legacy-topic-1',
    title: 'Legacy Topic Without New Fields',
    locale: 'en',
    tags: ['legacy', 'backward-compatibility'],
    thumbnailUrl: undefined, // Undefined (not set)
    seoTitle: undefined,
    seoDescription: undefined,
    seoKeywords: undefined,
    mainQuestion: 'How does the system handle topics without new fields?',
    article: {
      content: '<h1>Legacy Content</h1><p>This content predates the new SEO fields...</p>',
      status: 'PUBLISHED',
      seoTitle: undefined,
      seoDescription: undefined,
      seoKeywords: undefined
    },
    faqItems: [
      {
        question: 'Should legacy content still work?',
        answer: 'Yes, backward compatibility should be maintained for existing content.',
        order: 1
      }
    ]
  }
];

/**
 * Test topics with various thumbnail URL formats
 */
export const topicsWithVariousThumbnails: TopicTestData[] = [
  {
    slug: 'https-thumbnail-topic',
    title: 'Topic with HTTPS Thumbnail',
    locale: 'en',
    tags: ['thumbnail', 'https'],
    thumbnailUrl: 'https://secure.example.com/images/secure-thumbnail.jpg',
    seoTitle: 'Secure Thumbnail Topic',
    seoDescription: 'Topic with HTTPS thumbnail URL for security testing.',
    seoKeywords: ['https', 'secure', 'thumbnail'],
    mainQuestion: 'Are HTTPS thumbnails properly handled?',
    article: {
      content: '<h1>Secure Thumbnails</h1><p>Using HTTPS for all media assets...</p>',
      status: 'PUBLISHED',
      seoTitle: 'Article: Secure Media Assets',
      seoDescription: 'Best practices for secure media delivery.',
      seoKeywords: ['secure media', 'https', 'cdn']
    },
    faqItems: [
      {
        question: 'Why use HTTPS for thumbnails?',
        answer: 'HTTPS ensures secure delivery and prevents mixed content warnings.',
        order: 1
      }
    ]
  },
  {
    slug: 'cdn-thumbnail-topic',
    title: 'Topic with CDN Thumbnail',
    locale: 'en',
    tags: ['thumbnail', 'cdn'],
    thumbnailUrl: 'https://cdn.example.com/optimized/thumbnail-400x300.webp',
    seoTitle: 'CDN Optimized Thumbnail Topic',
    seoDescription: 'Topic demonstrating CDN-delivered, optimized thumbnail images.',
    seoKeywords: ['cdn', 'optimization', 'webp', 'performance'],
    mainQuestion: 'How do CDN thumbnails improve performance?',
    article: {
      content: '<h1>CDN Optimization</h1><p>Content delivery networks improve media performance...</p>',
      status: 'PUBLISHED',
      seoTitle: 'Article: CDN Media Optimization',
      seoDescription: 'Guide to optimizing media delivery through CDNs.',
      seoKeywords: ['cdn optimization', 'media delivery', 'performance']
    },
    faqItems: [
      {
        question: 'What are the benefits of CDN thumbnails?',
        answer: 'Faster loading times, reduced server load, and global content distribution.',
        order: 1
      }
    ]
  },
  {
    slug: 'relative-thumbnail-topic',
    title: 'Topic with Relative Thumbnail Path',
    locale: 'en',
    tags: ['thumbnail', 'relative'],
    thumbnailUrl: '/uploads/thumbnails/relative-path-thumbnail.png',
    seoTitle: 'Relative Path Thumbnail Topic',
    seoDescription: 'Topic testing relative thumbnail URL handling.',
    seoKeywords: ['relative path', 'thumbnail', 'url handling'],
    mainQuestion: 'How are relative thumbnail paths resolved?',
    article: {
      content: '<h1>Relative Paths</h1><p>Testing relative URL resolution...</p>',
      status: 'PUBLISHED',
      seoTitle: 'Article: URL Path Resolution',
      seoDescription: 'Understanding relative vs absolute URL handling.',
      seoKeywords: ['url resolution', 'relative paths', 'web development']
    },
    faqItems: [
      {
        question: 'When should you use relative paths?',
        answer: 'Relative paths are useful for internal assets and development flexibility.',
        order: 1
      }
    ]
  }
];

/**
 * Test topics with special characters in SEO fields
 */
export const topicsWithSpecialCharacters: TopicTestData[] = [
  {
    slug: 'special-chars-topic',
    title: 'Topic with Special Characters: "Quotes" & Symbols!',
    locale: 'en',
    tags: ['special-characters', 'encoding', 'test'],
    thumbnailUrl: 'https://example.com/images/special-chars-topic.jpg',
    seoTitle: 'Special Characters: "Testing" & Validation! @#$%',
    seoDescription: 'This topic tests handling of special characters: quotes "test", ampersands & symbols, and unicode: 你好',
    seoKeywords: ['special characters', 'encoding', 'unicode', 'quotes & symbols', 'validation'],
    mainQuestion: 'How are special characters handled in SEO fields?',
    article: {
      content: '<h1>Special Characters</h1><p>Testing: "quotes", &amp; symbols, and unicode 你好...</p>',
      status: 'PUBLISHED',
      seoTitle: 'Article: Character Encoding & Validation',
      seoDescription: 'Comprehensive guide to handling special characters: "quotes", symbols & unicode.',
      seoKeywords: ['character encoding', 'unicode support', 'special symbols', 'validation']
    },
    faqItems: [
      {
        question: 'How should special characters be encoded?',
        answer: 'Use proper UTF-8 encoding and HTML entity escaping where appropriate.',
        order: 1
      }
    ]
  }
];

/**
 * Test topics with very long SEO content
 */
export const topicsWithLongSEOContent: TopicTestData[] = [
  {
    slug: 'long-seo-content-topic',
    title: 'Topic with Very Long SEO Content for Length Validation Testing',
    locale: 'en',
    tags: ['long-content', 'validation', 'limits'],
    thumbnailUrl: 'https://example.com/images/long-content-topic.jpg',
    seoTitle: 'This is a Very Long SEO Title That Exceeds Normal Recommendations and Tests System Limits for Title Length Validation and Truncation Handling in Various Contexts',
    seoDescription: 'This is an extremely long SEO description that far exceeds the typical 160-character recommendation for meta descriptions. It is designed to test how the system handles very long descriptions, whether they are truncated, validated, or stored in full. This description continues to provide extensive detail about the topic, covering multiple aspects and use cases to ensure comprehensive testing of length limits and validation rules that may be in place for SEO metadata fields.',
    seoKeywords: [
      'very long keyword phrase that exceeds normal length',
      'another extremely long keyword for testing purposes',
      'comprehensive validation testing',
      'length limits',
      'truncation handling',
      'seo optimization',
      'metadata validation',
      'system limits testing',
      'boundary condition testing',
      'edge case validation'
    ],
    mainQuestion: 'How does the system handle very long SEO content?',
    article: {
      content: '<h1>Long Content Testing</h1><p>This article tests system limits for content length...</p>',
      status: 'PUBLISHED',
      seoTitle: 'Article with Extremely Long SEO Title for Comprehensive Length Validation and System Limit Testing',
      seoDescription: 'This article-level SEO description is also very long to test how the system handles extended metadata at the article level, including validation, storage, and retrieval of lengthy SEO descriptions.',
      seoKeywords: [
        'article level seo testing',
        'long content validation',
        'system boundary testing',
        'metadata length limits'
      ]
    },
    faqItems: [
      {
        question: 'What are the recommended lengths for SEO fields?',
        answer: 'Title: 50-60 characters, Description: 150-160 characters, Keywords: 5-10 relevant terms.',
        order: 1
      }
    ]
  }
];

/**
 * All test data sets combined for comprehensive testing
 */
export const allNewFieldsTestData = {
  complete: topicsWithCompleteFields,
  mixed: topicsWithMixedFields,
  legacy: topicsWithLegacyFieldsOnly,
  thumbnails: topicsWithVariousThumbnails,
  specialChars: topicsWithSpecialCharacters,
  longContent: topicsWithLongSEOContent
};

/**
 * Expected API response structures for new fields
 */
export const expectedNewFieldsSchema = {
  topic: {
    required: ['id', 'slug', 'title', 'locale', 'tags', 'createdAt', 'updatedAt'],
    optional: ['thumbnailUrl', 'seoTitle', 'seoDescription', 'seoKeywords'],
    properties: {
      thumbnailUrl: { type: 'string', nullable: true },
      seoTitle: { type: 'string', nullable: true },
      seoDescription: { type: 'string', nullable: true },
      seoKeywords: { type: 'array', items: { type: 'string' } }
    }
  },
  article: {
    required: ['id', 'content', 'status', 'createdAt', 'updatedAt'],
    optional: ['seoTitle', 'seoDescription', 'seoKeywords'],
    properties: {
      seoTitle: { type: 'string', nullable: true },
      seoDescription: { type: 'string', nullable: true },
      seoKeywords: { type: 'array', items: { type: 'string' } }
    }
  }
};

/**
 * Test scenarios for new field validation
 */
export const newFieldTestScenarios = [
  {
    name: 'Complete SEO Fields',
    description: 'All new SEO fields populated with valid data',
    testData: topicsWithCompleteFields,
    expectedBehavior: 'All fields should be present and properly formatted in API responses'
  },
  {
    name: 'Mixed Null/Populated Fields',
    description: 'Some fields null, some populated, some empty',
    testData: topicsWithMixedFields,
    expectedBehavior: 'Null fields should be handled gracefully, populated fields should be returned'
  },
  {
    name: 'Legacy Compatibility',
    description: 'Topics without any new fields (backward compatibility)',
    testData: topicsWithLegacyFieldsOnly,
    expectedBehavior: 'Topics should work normally, new fields should be null or omitted'
  },
  {
    name: 'Thumbnail URL Variations',
    description: 'Different thumbnail URL formats (HTTPS, CDN, relative)',
    testData: topicsWithVariousThumbnails,
    expectedBehavior: 'All valid URL formats should be preserved and returned correctly'
  },
  {
    name: 'Special Character Handling',
    description: 'SEO fields with special characters and unicode',
    testData: topicsWithSpecialCharacters,
    expectedBehavior: 'Special characters should be properly encoded and preserved'
  },
  {
    name: 'Length Validation',
    description: 'Very long SEO content to test system limits',
    testData: topicsWithLongSEOContent,
    expectedBehavior: 'Long content should be handled according to system validation rules'
  }
];