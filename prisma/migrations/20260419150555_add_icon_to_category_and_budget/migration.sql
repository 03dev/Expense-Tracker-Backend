-- AlterTable
ALTER TABLE "Budget" ADD COLUMN     "icon" TEXT;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "icon" TEXT;

-- CreateIndex
CREATE INDEX "Budget_userId_idx" ON "Budget"("userId");

-- CreateIndex
CREATE INDEX "Budget_userId_month_year_idx" ON "Budget"("userId", "month", "year");

-- CreateIndex
CREATE INDEX "Category_userId_idx" ON "Category"("userId");

-- CreateIndex
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");

-- CreateIndex
CREATE INDEX "Transaction_userId_date_idx" ON "Transaction"("userId", "date");

-- CreateIndex
CREATE INDEX "Transaction_userId_categoryId_idx" ON "Transaction"("userId", "categoryId");

-- CreateIndex
CREATE INDEX "Transaction_userId_deletedAt_idx" ON "Transaction"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX "Transaction_date_idx" ON "Transaction"("date");
