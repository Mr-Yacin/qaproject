const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifySeedData() {
  console.log('🔍 Verifying seed data...\n');

  try {
    // Count topics
    const topicCount = await prisma.topic.count();
    console.log(`✅ Topics: ${topicCount}`);

    // Get a sample topic with all relations
    const sampleTopic = await prisma.topic.findFirst({
      include: {
        questions: true,
        articles: true,
        faqItems: true,
      },
    });

    if (sampleTopic) {
      console.log('\n📋 Sample Topic:');
      console.log(`   ID: ${sampleTopic.id}`);
      console.log(`   Slug: ${sampleTopic.slug}`);
      console.log(`   Title: ${sampleTopic.title}`);
      console.log(`   Locale: ${sampleTopic.locale}`);
      console.log(`   Tags: ${sampleTopic.tags.join(', ')}`);
      console.log(`   Questions: ${sampleTopic.questions.length}`);
      console.log(`   Articles: ${sampleTopic.articles.length}`);
      console.log(`   FAQ Items: ${sampleTopic.faqItems.length}`);

      // Check primary question
      const primaryQuestion = sampleTopic.questions.find(q => q.isPrimary);
      if (primaryQuestion) {
        console.log(`   Primary Question: "${primaryQuestion.text}"`);
      }

      // Check article status
      if (sampleTopic.articles[0]) {
        console.log(`   Article Status: ${sampleTopic.articles[0].status}`);
      }

      // Check FAQ order
      const faqOrders = sampleTopic.faqItems.map(f => f.order).sort((a, b) => a - b);
      console.log(`   FAQ Orders: ${faqOrders.join(', ')}`);
    }

    // Count by status
    const publishedCount = await prisma.article.count({
      where: { status: 'PUBLISHED' },
    });
    const draftCount = await prisma.article.count({
      where: { status: 'DRAFT' },
    });

    console.log('\n📊 Article Status:');
    console.log(`   Published: ${publishedCount}`);
    console.log(`   Draft: ${draftCount}`);

    // Count by locale
    const topics = await prisma.topic.findMany({
      select: { locale: true },
    });
    const locales = topics.reduce((acc, t) => {
      acc[t.locale] = (acc[t.locale] || 0) + 1;
      return acc;
    }, {});

    console.log('\n🌍 Locales:');
    Object.entries(locales).forEach(([locale, count]) => {
      console.log(`   ${locale}: ${count}`);
    });

    // Verify all topics have required relations
    const topicsWithRelations = await prisma.topic.findMany({
      include: {
        questions: true,
        articles: true,
        faqItems: true,
      },
    });

    const missingRelations = topicsWithRelations.filter(
      t => t.questions.length === 0 || t.articles.length === 0 || t.faqItems.length < 3
    );

    if (missingRelations.length > 0) {
      console.log('\n⚠️  Topics with missing relations:');
      missingRelations.forEach(t => {
        console.log(`   ${t.slug}: Q=${t.questions.length}, A=${t.articles.length}, FAQ=${t.faqItems.length}`);
      });
    } else {
      console.log('\n✅ All topics have required relations (1 question, 1 article, 3+ FAQs)');
    }

    console.log('\n✅ Verification complete!');
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifySeedData();
