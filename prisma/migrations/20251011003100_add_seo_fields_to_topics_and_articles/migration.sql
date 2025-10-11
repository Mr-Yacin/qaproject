-- DropIndex
DROP INDEX "Article_seoKeywords_idx";

-- DropIndex
DROP INDEX "Topic_seoKeywords_idx";

-- CreateIndex
CREATE INDEX "Article_seoKeywords_idx" ON "Article"("seoKeywords");

-- CreateIndex
CREATE INDEX "Topic_seoKeywords_idx" ON "Topic"("seoKeywords");
