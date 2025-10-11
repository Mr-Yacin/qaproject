-- Add SEO fields to Topic and Article models
-- This migration adds meta title, description, and keywords for better SEO

-- Add SEO fields to Topic table
ALTER TABLE "Topic" ADD COLUMN "seoTitle" TEXT;
ALTER TABLE "Topic" ADD COLUMN "seoDescription" TEXT;
ALTER TABLE "Topic" ADD COLUMN "seoKeywords" TEXT[];

-- Add SEO fields to Article table  
ALTER TABLE "Article" ADD COLUMN "seoTitle" TEXT;
ALTER TABLE "Article" ADD COLUMN "seoDescription" TEXT;
ALTER TABLE "Article" ADD COLUMN "seoKeywords" TEXT[];

-- Add indexes for SEO fields (for search optimization)
CREATE INDEX "Topic_seoKeywords_idx" ON "Topic" USING GIN ("seoKeywords");
CREATE INDEX "Article_seoKeywords_idx" ON "Article" USING GIN ("seoKeywords");