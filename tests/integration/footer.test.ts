import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '@/lib/db';

/**
 * Integration tests for Footer component
 * Tests that footer data is properly seeded and can be fetched
 */
describe('Footer Integration Tests', () => {
  beforeAll(async () => {
    // Ensure we have footer data
    const footerSettings = await prisma.footerSettings.findFirst();
    if (!footerSettings) {
      throw new Error('Footer settings not found. Please run seed script.');
    }
  });

  it('should have footer settings in database', async () => {
    const settings = await prisma.footerSettings.findFirst();
    
    expect(settings).toBeDefined();
    expect(settings?.copyrightText).toBeDefined();
    expect(settings?.copyrightText).toContain('Q&A Article FAQ');
  });

  it('should have footer columns in database', async () => {
    const columns = await prisma.footerColumn.findMany({
      orderBy: { order: 'asc' },
    });
    
    expect(columns.length).toBeGreaterThan(0);
    expect(columns[0].title).toBeDefined();
  });

  it('should have footer links in database', async () => {
    const links = await prisma.footerLink.findMany();
    
    expect(links.length).toBeGreaterThan(0);
    expect(links[0].label).toBeDefined();
    expect(links[0].url).toBeDefined();
  });

  it('should fetch complete footer configuration', async () => {
    const [settings, columns] = await Promise.all([
      prisma.footerSettings.findFirst(),
      prisma.footerColumn.findMany({
        include: {
          links: {
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      }),
    ]);

    expect(settings).toBeDefined();
    expect(columns.length).toBeGreaterThan(0);
    
    // Check that at least one column has links
    const columnsWithLinks = columns.filter(col => col.links.length > 0);
    expect(columnsWithLinks.length).toBeGreaterThan(0);
  });

  it('should have social links in footer settings', async () => {
    const settings = await prisma.footerSettings.findFirst();
    
    expect(settings?.socialLinks).toBeDefined();
    
    const socialLinks = settings?.socialLinks as Record<string, string> | null;
    expect(socialLinks).not.toBeNull();
    
    if (socialLinks) {
      // Should have at least one social link
      expect(Object.keys(socialLinks).length).toBeGreaterThan(0);
    }
  });

  it('should order footer columns correctly', async () => {
    const columns = await prisma.footerColumn.findMany({
      orderBy: { order: 'asc' },
    });
    
    // Verify columns are ordered
    for (let i = 1; i < columns.length; i++) {
      expect(columns[i].order).toBeGreaterThanOrEqual(columns[i - 1].order);
    }
  });

  it('should order footer links within columns correctly', async () => {
    const columns = await prisma.footerColumn.findMany({
      include: {
        links: {
          orderBy: { order: 'asc' },
        },
      },
    });
    
    // Check each column's links are ordered
    for (const column of columns) {
      if (column.links.length > 1) {
        for (let i = 1; i < column.links.length; i++) {
          expect(column.links[i].order).toBeGreaterThanOrEqual(column.links[i - 1].order);
        }
      }
    }
  });
});
