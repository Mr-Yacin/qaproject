import { beforeAll, afterAll, beforeEach } from 'vitest';
import { cleanDatabase } from './utils/test-helpers';
import { prisma } from '../src/lib/db';

// Set test environment variables
process.env.INGEST_API_KEY = 'test-api-key';
process.env.INGEST_WEBHOOK_SECRET = 'test-webhook-secret';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

beforeAll(async () => {
  // Ensure database connection is established
  await prisma.$connect();
});

beforeEach(async () => {
  // Clean database before each test
  await cleanDatabase();
});

afterAll(async () => {
  // Clean up and disconnect
  await cleanDatabase();
  await prisma.$disconnect();
});
