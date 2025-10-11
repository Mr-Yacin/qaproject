import { PrismaClient, ContentStatus, UserRole } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

interface SeedOptions {
  clear?: boolean;
  count?: number;
}

// Parse command line arguments
function parseArgs(): SeedOptions {
  const args = process.argv.slice(2);
  const options: SeedOptions = {
    clear: true,
    count: 20,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--no-clear' || args[i] === '--append') {
      options.clear = false;
    } else if (args[i] === '--clear') {
      options.clear = true;
    } else if (args[i] === '--count' && args[i + 1]) {
      options.count = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i].startsWith('--count=')) {
      options.count = parseInt(args[i].split('=')[1], 10);
    } else if (args[i] === '--small') {
      options.count = 10;
    } else if (args[i] === '--medium') {
      options.count = 25;
    } else if (args[i] === '--large') {
      options.count = 50;
    } else if (args[i] === '--xl') {
      options.count = 100;
    } else if (!args[i].startsWith('--') && !isNaN(parseInt(args[i], 10))) {
      // Support direct number argument
      options.count = parseInt(args[i], 10);
    }
  }

  return options;
}

async function createTopic(index: number) {
  // Generate more realistic content based on topic categories
  const categories = [
    {
      name: 'technology',
      titles: ['How to Set Up', 'Understanding', 'Best Practices for', 'Getting Started with', 'Advanced'],
      subjects: ['React Development', 'API Integration', 'Database Design', 'Cloud Computing', 'DevOps', 'Machine Learning'],
      tags: ['technology', 'programming', 'web-development', 'software', 'api', 'database']
    },
    {
      name: 'business',
      titles: ['How to Start', 'Managing', 'Strategies for', 'Building', 'Growing'],
      subjects: ['Small Business', 'Marketing Campaigns', 'Team Management', 'Financial Planning', 'Customer Relations'],
      tags: ['business', 'marketing', 'finance', 'management', 'strategy', 'entrepreneurship']
    },
    {
      name: 'health',
      titles: ['Understanding', 'Managing', 'Preventing', 'Treating', 'Living with'],
      subjects: ['Mental Health', 'Nutrition', 'Exercise', 'Sleep Disorders', 'Chronic Conditions'],
      tags: ['health', 'wellness', 'nutrition', 'fitness', 'mental-health', 'medical']
    },
    {
      name: 'education',
      titles: ['Learning', 'Teaching', 'Mastering', 'Understanding', 'Exploring'],
      subjects: ['Online Learning', 'Study Techniques', 'Career Development', 'Skill Building', 'Academic Success'],
      tags: ['education', 'learning', 'skills', 'career', 'academic', 'training']
    }
  ];

  const category = faker.helpers.arrayElement(categories);
  const titlePrefix = faker.helpers.arrayElement(category.titles);
  const subject = faker.helpers.arrayElement(category.subjects);
  const title = `${titlePrefix} ${subject}`;
  const slug = faker.helpers.slugify(title).toLowerCase() + `-${index}`;
  const locale = faker.helpers.arrayElement(['en', 'es', 'fr', 'de']);
  const tags = faker.helpers.arrayElements(category.tags, { min: 2, max: 4 });
  
  const articleStatus = faker.helpers.weightedArrayElement([
    { weight: 7, value: ContentStatus.PUBLISHED },
    { weight: 3, value: ContentStatus.DRAFT }
  ]);

  // Generate SEO fields
  const seoTitle = `${title} - Complete Guide`;
  const seoDescription = faker.lorem.sentences(2, ' ').substring(0, 160);
  const seoKeywords = [...tags, ...faker.helpers.arrayElements(
    ['guide', 'tutorial', 'tips', 'help', 'how-to', 'best-practices'],
    { min: 2, max: 3 }
  )];

  // Generate more realistic questions
  const questionCount = faker.number.int({ min: 2, max: 5 });
  const questionTemplates = [
    `What is ${subject.toLowerCase()}?`,
    `How do I get started with ${subject.toLowerCase()}?`,
    `What are the benefits of ${subject.toLowerCase()}?`,
    `What are common mistakes in ${subject.toLowerCase()}?`,
    `How long does it take to learn ${subject.toLowerCase()}?`,
    `What tools are needed for ${subject.toLowerCase()}?`,
    `Is ${subject.toLowerCase()} suitable for beginners?`
  ];

  const questions = Array.from({ length: questionCount }, (_, i) => ({
    text: i === 0 ? questionTemplates[0] : faker.helpers.arrayElement(questionTemplates.slice(1)),
    isPrimary: i === 0,
  }));

  // Generate more realistic FAQ items
  const faqCount = faker.number.int({ min: 4, max: 8 });
  const faqTemplates = [
    { q: `What is ${subject.toLowerCase()}?`, a: `${subject} is a comprehensive approach that involves...` },
    { q: `How much does ${subject.toLowerCase()} cost?`, a: 'The cost varies depending on several factors...' },
    { q: `Is ${subject.toLowerCase()} difficult to learn?`, a: 'The learning curve depends on your background and experience...' },
    { q: `What are the prerequisites for ${subject.toLowerCase()}?`, a: 'While there are no strict prerequisites, having knowledge of...' },
    { q: `How long does it take to see results?`, a: 'Results typically become visible within...' },
    { q: `Can I do this remotely?`, a: 'Yes, many aspects can be handled remotely...' },
    { q: `What are the common challenges?`, a: 'Some common challenges include...' },
    { q: `Are there any alternatives?`, a: 'There are several alternatives you might consider...' }
  ];

  const faqItems = Array.from({ length: faqCount }, (_, i) => {
    const template = faker.helpers.arrayElement(faqTemplates);
    return {
      question: template.q,
      answer: template.a + ' ' + faker.lorem.paragraphs(faker.number.int({ min: 1, max: 3 }), '\n\n'),
      order: i + 1,
    };
  });

  // Generate more comprehensive article content
  const articleContent = `
# ${title}

${faker.lorem.paragraph()}

## Overview

${faker.lorem.paragraphs(2, '\n\n')}

## Key Points

${Array.from({ length: faker.number.int({ min: 3, max: 6 }) }, () => 
  `- ${faker.lorem.sentence()}`
).join('\n')}

## Getting Started

${faker.lorem.paragraphs(2, '\n\n')}

## Best Practices

${Array.from({ length: faker.number.int({ min: 4, max: 7 }) }, (_, i) => 
  `${i + 1}. ${faker.lorem.sentence()}\n   ${faker.lorem.sentence()}`
).join('\n\n')}

## Common Challenges

${faker.lorem.paragraphs(2, '\n\n')}

## Conclusion

${faker.lorem.paragraph()}
  `.trim();

  // Create topic with all relations
  const topic = await prisma.topic.create({
    data: {
      slug,
      title,
      locale,
      tags,
      seoTitle,
      seoDescription,
      seoKeywords,
      questions: {
        create: questions,
      },
      articles: {
        create: {
          content: articleContent,
          status: articleStatus,
          seoTitle: seoTitle,
          seoDescription: seoDescription,
          seoKeywords: seoKeywords,
        },
      },
      faqItems: {
        create: faqItems,
      },
    },
    include: {
      questions: true,
      articles: true,
      faqItems: true,
    },
  });

  return topic;
}

async function seedCMSDefaults() {
  console.log('🎨 Seeding CMS default data...');

  // Create default SiteSettings
  const existingSettings = await prisma.siteSettings.findFirst();
  if (!existingSettings) {
    await prisma.siteSettings.create({
      data: {
        siteName: 'Q&A Article FAQ',
        seoTitle: 'Q&A Article FAQ - Your Complete Knowledge Base',
        seoDescription: 'Comprehensive Q&A articles, FAQs, and expert guides covering technology, business, health, and education topics.',
        seoKeywords: ['qa', 'faq', 'knowledge base', 'articles', 'guides', 'tutorials', 'help', 'support'],
        socialLinks: {
          twitter: 'https://twitter.com/qafaq',
          facebook: 'https://facebook.com/qafaq',
          linkedin: 'https://linkedin.com/company/qafaq',
          youtube: 'https://youtube.com/@qafaq',
          instagram: 'https://instagram.com/qafaq'
        },
      },
    });
    console.log('   ✅ Created default site settings');
  } else {
    console.log('   ⏭️  Site settings already exist');
  }

  // Create default users with different roles
  const users = [
    { email: 'admin@example.com', password: 'admin123', name: 'Admin User', role: UserRole.ADMIN },
    { email: 'editor@example.com', password: 'editor123', name: 'Content Editor', role: UserRole.EDITOR },
    { email: 'viewer@example.com', password: 'viewer123', name: 'Content Viewer', role: UserRole.VIEWER },
  ];

  for (const userData of users) {
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          name: userData.name,
          role: userData.role,
          isActive: true,
        },
      });
      console.log(`   ✅ Created ${userData.role.toLowerCase()} user (${userData.email})`);
    } else {
      console.log(`   ⏭️  User ${userData.email} already exists`);
    }
  }

  // Create default menu structure
  const existingMenuItems = await prisma.menuItem.count();
  if (existingMenuItems === 0) {
    await prisma.menuItem.createMany({
      data: [
        { label: 'Home', url: '/', order: 1, isExternal: false, openNewTab: false },
        { label: 'Topics', url: '/topics', order: 2, isExternal: false, openNewTab: false },
        { label: 'About', url: '/pages/about', order: 3, isExternal: false, openNewTab: false },
        { label: 'Contact', url: '/pages/contact', order: 4, isExternal: false, openNewTab: false },
      ],
    });
    console.log('   ✅ Created default menu structure');
  } else {
    console.log('   ⏭️  Menu items already exist');
  }

  // Create default footer configuration
  const existingFooterSettings = await prisma.footerSettings.findFirst();
  if (!existingFooterSettings) {
    await prisma.footerSettings.create({
      data: {
        copyrightText: `© ${new Date().getFullYear()} Q&A Article FAQ. All rights reserved.`,
        socialLinks: {
          twitter: 'https://twitter.com/example',
          facebook: 'https://facebook.com/example',
          linkedin: 'https://linkedin.com/company/example',
        },
      },
    });
    console.log('   ✅ Created default footer settings');
  } else {
    console.log('   ⏭️  Footer settings already exist');
  }

  // Create default footer columns
  const existingFooterColumns = await prisma.footerColumn.count();
  if (existingFooterColumns === 0) {
    const aboutColumn = await prisma.footerColumn.create({
      data: {
        title: 'About',
        order: 1,
      },
    });

    const resourcesColumn = await prisma.footerColumn.create({
      data: {
        title: 'Resources',
        order: 2,
      },
    });

    const legalColumn = await prisma.footerColumn.create({
      data: {
        title: 'Legal',
        order: 3,
      },
    });

    // Create footer links
    await prisma.footerLink.createMany({
      data: [
        // About column
        { columnId: aboutColumn.id, label: 'About Us', url: '/pages/about', order: 1 },
        { columnId: aboutColumn.id, label: 'Contact', url: '/pages/contact', order: 2 },
        { columnId: aboutColumn.id, label: 'Team', url: '/pages/team', order: 3 },
        // Resources column
        { columnId: resourcesColumn.id, label: 'Topics', url: '/topics', order: 1 },
        { columnId: resourcesColumn.id, label: 'FAQ', url: '/pages/faq', order: 2 },
        { columnId: resourcesColumn.id, label: 'Blog', url: '/pages/blog', order: 3 },
        // Legal column
        { columnId: legalColumn.id, label: 'Privacy Policy', url: '/pages/privacy', order: 1 },
        { columnId: legalColumn.id, label: 'Terms of Service', url: '/pages/terms', order: 2 },
        { columnId: legalColumn.id, label: 'Cookie Policy', url: '/pages/cookies', order: 3 },
      ],
    });
    console.log('   ✅ Created default footer columns and links');
  } else {
    console.log('   ⏭️  Footer columns already exist');
  }

  // Create default pages
  const existingPages = await prisma.page.count();
  if (existingPages === 0) {
    const defaultPages = [
      {
        slug: 'about',
        title: 'About Us',
        content: `# About Q&A Article FAQ

Welcome to our comprehensive knowledge base platform. We're dedicated to providing high-quality, well-researched answers to your most important questions.

## Our Mission

Our mission is to make knowledge accessible to everyone. We believe that everyone deserves access to accurate, up-to-date information that can help them make informed decisions.

## What We Offer

- **Comprehensive Q&A Articles**: In-depth answers to complex questions
- **Expert-Curated FAQs**: Quick answers to common questions
- **Multi-Language Support**: Content available in multiple languages
- **Regular Updates**: Our content is continuously updated to reflect the latest information

## Our Team

Our team consists of subject matter experts, researchers, and content creators who are passionate about sharing knowledge and helping others learn.

Contact us at info@example.com for more information.`,
        status: ContentStatus.PUBLISHED,
        seoTitle: 'About Us - Q&A Article FAQ',
        seoDescription: 'Learn about our mission to make knowledge accessible through comprehensive Q&A articles and expert-curated FAQs.',
        seoKeywords: ['about', 'mission', 'team', 'knowledge base', 'qa', 'faq']
      },
      {
        slug: 'contact',
        title: 'Contact Us',
        content: `# Contact Us

We'd love to hear from you! Whether you have questions, suggestions, or feedback, we're here to help.

## Get in Touch

**Email**: info@example.com
**Phone**: +1 (555) 123-4567
**Address**: 123 Knowledge Street, Learning City, LC 12345

## Business Hours

- **Monday - Friday**: 9:00 AM - 6:00 PM EST
- **Saturday**: 10:00 AM - 4:00 PM EST
- **Sunday**: Closed

## Frequently Asked Questions

Before reaching out, you might find your answer in our [FAQ section](/pages/faq).

## Feedback

Your feedback helps us improve. If you have suggestions for new topics or improvements to existing content, please let us know!`,
        status: ContentStatus.PUBLISHED,
        seoTitle: 'Contact Us - Q&A Article FAQ',
        seoDescription: 'Get in touch with our team. Contact information, business hours, and ways to reach us.',
        seoKeywords: ['contact', 'support', 'help', 'feedback', 'email', 'phone']
      },
      {
        slug: 'privacy',
        title: 'Privacy Policy',
        content: `# Privacy Policy

Last updated: ${new Date().toLocaleDateString()}

## Information We Collect

We collect information you provide directly to us, such as when you create an account, subscribe to our newsletter, or contact us.

## How We Use Your Information

We use the information we collect to:
- Provide, maintain, and improve our services
- Send you technical notices and support messages
- Respond to your comments and questions
- Communicate with you about products, services, and events

## Information Sharing

We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.

## Data Security

We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.

## Contact Us

If you have any questions about this Privacy Policy, please contact us at privacy@example.com.`,
        status: ContentStatus.PUBLISHED,
        seoTitle: 'Privacy Policy - Q&A Article FAQ',
        seoDescription: 'Our privacy policy explains how we collect, use, and protect your personal information.',
        seoKeywords: ['privacy', 'policy', 'data', 'security', 'information', 'protection']
      },
      {
        slug: 'terms',
        title: 'Terms of Service',
        content: `# Terms of Service

Last updated: ${new Date().toLocaleDateString()}

## Acceptance of Terms

By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement.

## Use License

Permission is granted to temporarily download one copy of the materials on our website for personal, non-commercial transitory viewing only.

## Disclaimer

The materials on our website are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.

## Limitations

In no event shall our company or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on our website.

## Contact Information

For questions about these Terms of Service, please contact us at legal@example.com.`,
        status: ContentStatus.PUBLISHED,
        seoTitle: 'Terms of Service - Q&A Article FAQ',
        seoDescription: 'Terms and conditions for using our Q&A Article FAQ platform and services.',
        seoKeywords: ['terms', 'service', 'conditions', 'legal', 'agreement', 'usage']
      }
    ];

    for (const pageData of defaultPages) {
      await prisma.page.create({
        data: pageData,
      });
    }
    console.log('   ✅ Created default pages (About, Contact, Privacy, Terms)');
  } else {
    console.log('   ⏭️  Default pages already exist');
  }

  console.log('✅ CMS defaults seeded successfully!\n');
}

async function seed(options: SeedOptions = {}) {
  const { clear = false, count = 20 } = options;

  console.log('🌱 Starting database seed...');
  console.log(`Options: clear=${clear}, count=${count}`);

  try {
    // Seed CMS defaults first (always run, idempotent)
    await seedCMSDefaults();

    // Clear existing data if requested
    if (clear) {
      console.log('🗑️  Clearing existing topic data...');
      await prisma.fAQItem.deleteMany();
      await prisma.article.deleteMany();
      await prisma.question.deleteMany();
      await prisma.topic.deleteMany();
      console.log('✅ Topic data cleared');
    }

    // Create topics
    const topics = [];
    
    if (count > 0) {
      console.log(`📝 Creating ${count} topics...`);

      for (let i = 0; i < count; i++) {
        try {
          const topic = await createTopic(i);
          topics.push(topic);
          
          // Progress indicator
          if ((i + 1) % 5 === 0) {
            console.log(`   Created ${i + 1}/${count} topics...`);
          }
        } catch (error) {
          console.error(`❌ Failed to create topic ${i}:`, error);
          // Continue with remaining topics
        }
      }
    } else {
      console.log('📝 Skipping topic creation (count = 0)');
    }

    console.log('\n✅ Seed completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Topics created: ${topics.length}`);
    console.log(`   Questions created: ${topics.reduce((sum, t) => sum + t.questions.length, 0)}`);
    console.log(`   Articles created: ${topics.reduce((sum, t) => sum + t.articles.length, 0)}`);
    console.log(`   FAQ items created: ${topics.reduce((sum, t) => sum + t.faqItems.length, 0)}`);
    
    // Show status breakdown
    const publishedCount = topics.filter(t => t.articles[0]?.status === ContentStatus.PUBLISHED).length;
    const draftCount = topics.filter(t => t.articles[0]?.status === ContentStatus.DRAFT).length;
    console.log(`   Published articles: ${publishedCount} (${Math.round(publishedCount/topics.length*100)}%)`);
    console.log(`   Draft articles: ${draftCount} (${Math.round(draftCount/topics.length*100)}%)`);
    
    // Show locale breakdown
    const locales = topics.reduce((acc, t) => {
      acc[t.locale] = (acc[t.locale] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log(`   Locales: ${Object.entries(locales).map(([k, v]) => `${k}=${v}`).join(', ')}`);

    // Show tag statistics
    const allTags = topics.flatMap(t => t.tags);
    const tagCounts = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([tag, count]) => `${tag}(${count})`)
      .join(', ');
    console.log(`   Top tags: ${topTags}`);

    // Show database totals
    const totalTopics = await prisma.topic.count();
    const totalUsers = await prisma.user.count();
    const totalPages = await prisma.page.count();
    console.log('\n📈 Database Totals:');
    console.log(`   Total topics: ${totalTopics}`);
    console.log(`   Total users: ${totalUsers}`);
    console.log(`   Total pages: ${totalPages}`);

    console.log('\n🔗 Quick Links:');
    console.log('   Admin login: http://localhost:3000/admin (admin@example.com / admin123)');
    console.log('   Public API: http://localhost:3000/api/topics');
    console.log('   Topics page: http://localhost:3000/topics');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

// Run seed
const options = parseArgs();
seed(options)
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
