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
    if (args[i] === '--no-clear') {
      options.clear = false;
    } else if (args[i] === '--count' && args[i + 1]) {
      options.count = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i].startsWith('--count=')) {
      options.count = parseInt(args[i].split('=')[1], 10);
    } else if (!args[i].startsWith('--') && !isNaN(parseInt(args[i], 10))) {
      // Support direct number argument
      options.count = parseInt(args[i], 10);
    }
  }

  return options;
}

async function createTopic(index: number) {
  // Generate varied content
  const title = faker.lorem.sentence({ min: 3, max: 6 }).replace(/\.$/, '');
  const slug = faker.helpers.slugify(title).toLowerCase() + `-${index}`;
  const locale = faker.helpers.arrayElement(['en', 'es', 'fr']);
  const tags = faker.helpers.arrayElements(
    ['technology', 'business', 'health', 'education', 'finance', 'lifestyle', 'science', 'sports'],
    { min: 2, max: 4 }
  );
  const articleStatus = faker.helpers.arrayElement([
    ContentStatus.PUBLISHED,
    ContentStatus.PUBLISHED, // Weight towards PUBLISHED
    ContentStatus.DRAFT,
  ]);

  // Generate FAQ items (3-6 items)
  const faqCount = faker.number.int({ min: 3, max: 6 });
  const faqItems = Array.from({ length: faqCount }, (_, i) => ({
    question: faker.lorem.sentence() + '?',
    answer: faker.lorem.paragraphs(2, '\n\n'),
    order: i + 1,
  }));

  // Create topic with all relations
  const topic = await prisma.topic.create({
    data: {
      slug,
      title,
      locale,
      tags,
      questions: {
        create: [
          {
            text: faker.lorem.sentence() + '?',
            isPrimary: true,
          },
        ],
      },
      articles: {
        create: {
          content: faker.lorem.paragraphs(3, '\n\n'),
          status: articleStatus,
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
        seoTitle: 'Q&A Article FAQ - Your Knowledge Base',
        seoDescription: 'Comprehensive Q&A articles and FAQs for all your questions',
        seoKeywords: ['qa', 'faq', 'knowledge base', 'articles'],
        socialLinks: {
          twitter: 'https://twitter.com/example',
          facebook: 'https://facebook.com/example',
          linkedin: 'https://linkedin.com/company/example',
        },
      },
    });
    console.log('   ✅ Created default site settings');
  } else {
    console.log('   ⏭️  Site settings already exist');
  }

  // Create default admin user
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@example.com' },
  });
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: hashedPassword,
        name: 'Admin User',
        role: UserRole.ADMIN,
        isActive: true,
      },
    });
    console.log('   ✅ Created default admin user (email: admin@example.com, password: admin123)');
  } else {
    console.log('   ⏭️  Admin user already exists');
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
    console.log(`📝 Creating ${count} topics...`);
    const topics = [];

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

    console.log('\n✅ Seed completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Topics created: ${topics.length}`);
    console.log(`   Questions created: ${topics.reduce((sum, t) => sum + t.questions.length, 0)}`);
    console.log(`   Articles created: ${topics.reduce((sum, t) => sum + t.articles.length, 0)}`);
    console.log(`   FAQ items created: ${topics.reduce((sum, t) => sum + t.faqItems.length, 0)}`);
    
    // Show status breakdown
    const publishedCount = topics.filter(t => t.articles[0]?.status === ContentStatus.PUBLISHED).length;
    const draftCount = topics.filter(t => t.articles[0]?.status === ContentStatus.DRAFT).length;
    console.log(`   Published articles: ${publishedCount}`);
    console.log(`   Draft articles: ${draftCount}`);
    
    // Show locale breakdown
    const locales = topics.reduce((acc, t) => {
      acc[t.locale] = (acc[t.locale] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log(`   Locales: ${Object.entries(locales).map(([k, v]) => `${k}=${v}`).join(', ')}`);

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
