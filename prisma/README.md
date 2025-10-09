# Database Seeding

This directory contains the database seed script for generating realistic test data.

## Overview

The seed script (`seed.ts`) uses Faker.js to generate realistic test data including:
- Topics with unique slugs and varied content
- Primary questions for each topic
- Articles with PUBLISHED and DRAFT statuses
- FAQ items (3-6 per topic)
- Multiple locales (en, es, fr)
- Varied tags

## Usage

### Basic Seeding (20 topics, clear existing data)
```bash
npm run seed
```

### Append Mode (add without clearing)
```bash
npm run seed:append
```

### Large Dataset (50 topics)
```bash
npm run seed:large
```

### Custom Count
```bash
npx tsx prisma/seed.ts --count 30
```

### Append with Custom Count
```bash
npx tsx prisma/seed.ts --no-clear --count 10
```

## Options

- `--count <number>` - Number of topics to create (default: 20)
- `--no-clear` - Don't clear existing data before seeding (default: clear)

## Verification

After seeding, verify the data was created correctly:

```bash
npm run verify:seed
```

This will show:
- Total count of topics, questions, articles, and FAQ items
- Sample topic with all relations
- Article status breakdown (PUBLISHED vs DRAFT)
- Locale distribution
- Validation that all topics have required relations

## Data Structure

Each topic includes:
- **Slug**: Unique, URL-friendly identifier
- **Title**: 3-6 word sentence
- **Locale**: Randomly selected from en, es, fr
- **Tags**: 2-4 tags from predefined list
- **Primary Question**: One question marked as primary
- **Article**: Content with PUBLISHED or DRAFT status
- **FAQ Items**: 3-6 items with ordered questions and answers

## Examples

### Seed 100 topics for load testing
```bash
npx tsx prisma/seed.ts --count 100
```

### Add 10 more topics without clearing
```bash
npx tsx prisma/seed.ts --no-clear --count 10
```

### Reset and seed with default 20 topics
```bash
npm run seed
```

## Troubleshooting

If you encounter errors:

1. **Database connection issues**: Ensure `DATABASE_URL` is set in `.env`
2. **Migration errors**: Run `npx prisma migrate dev` first
3. **Duplicate slugs**: The script uses indexed suffixes to prevent duplicates

## Development

The seed script is located at `prisma/seed.ts` and uses:
- `@faker-js/faker` for generating realistic data
- `@prisma/client` for database operations
- TypeScript for type safety

To modify the seed data structure, edit the `createTopic()` function in `seed.ts`.
