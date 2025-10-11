-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_createdAt_idx" ON "AuditLog"("entityType", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "Media_uploadedBy_idx" ON "Media"("uploadedBy");

-- CreateIndex
CREATE INDEX "Media_mimeType_createdAt_idx" ON "Media"("mimeType", "createdAt");

-- CreateIndex
CREATE INDEX "Page_updatedAt_idx" ON "Page"("updatedAt");

-- CreateIndex
CREATE INDEX "Page_status_updatedAt_idx" ON "Page"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "Topic_createdAt_idx" ON "Topic"("createdAt");

-- CreateIndex
CREATE INDEX "Topic_updatedAt_idx" ON "Topic"("updatedAt");

-- CreateIndex
CREATE INDEX "Topic_locale_updatedAt_idx" ON "Topic"("locale", "updatedAt");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE INDEX "User_role_isActive_idx" ON "User"("role", "isActive");
