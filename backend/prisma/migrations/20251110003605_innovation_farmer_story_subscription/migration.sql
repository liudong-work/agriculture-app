-- CreateEnum
CREATE TYPE "SubscriptionCycle" AS ENUM ('weekly', 'biweekly', 'monthly', 'seasonal');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'paused', 'cancelled', 'completed');

-- AlterTable
ALTER TABLE "FarmerProfile" ADD COLUMN     "certifications" JSONB,
ADD COLUMN     "heroImage" TEXT,
ADD COLUMN     "region" TEXT,
ADD COLUMN     "storyContent" TEXT,
ADD COLUMN     "storyGallery" JSONB,
ADD COLUMN     "storyHeadline" TEXT,
ADD COLUMN     "storyHighlights" TEXT[];

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "subscriptionId" TEXT;

-- CreateTable
CREATE TABLE "FarmerStory" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "media" JSONB,
    "labels" TEXT[],
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FarmerStory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "coverImage" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "originalPrice" DECIMAL(10,2),
    "cycle" "SubscriptionCycle" NOT NULL,
    "deliverWeekday" INTEGER,
    "items" JSONB,
    "benefits" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "farmerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'active',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextDeliveryDate" TIMESTAMP(3),
    "lastShipmentAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionDelivery" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionDelivery_orderId_key" ON "SubscriptionDelivery"("orderId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "UserSubscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmerStory" ADD CONSTRAINT "FarmerStory_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "FarmerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionPlan" ADD CONSTRAINT "SubscriptionPlan_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "FarmerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubscription" ADD CONSTRAINT "UserSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubscription" ADD CONSTRAINT "UserSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionDelivery" ADD CONSTRAINT "SubscriptionDelivery_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "UserSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionDelivery" ADD CONSTRAINT "SubscriptionDelivery_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
