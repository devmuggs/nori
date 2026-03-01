/*
  Warnings:

  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `UserRevision` table. All the data in the column will be lost.
  - You are about to drop the column `displayName` on the `UserRevision` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `UserRevision` table. All the data in the column will be lost.
  - Added the required column `user_id` to the `UserRevision` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "UserRevision" DROP CONSTRAINT "UserRevision_userId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "createdAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "UserRevision" DROP COLUMN "createdAt",
DROP COLUMN "displayName",
DROP COLUMN "userId",
ADD COLUMN     "avatar_url" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "display_name" TEXT,
ADD COLUMN     "user_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "IdentityProvider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdentityProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFederation" (
    "id" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,

    CONSTRAINT "UserFederation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Object" (
    "id" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploaded_by" TEXT NOT NULL,

    CONSTRAINT "Object_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IdentityProvider_name_key" ON "IdentityProvider"("name");

-- CreateIndex
CREATE INDEX "UserFederation_user_id_idx" ON "UserFederation"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "UserFederation_provider_id_external_id_key" ON "UserFederation"("provider_id", "external_id");

-- CreateIndex
CREATE INDEX "Object_uploaded_by_idx" ON "Object"("uploaded_by");

-- AddForeignKey
ALTER TABLE "UserRevision" ADD CONSTRAINT "UserRevision_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFederation" ADD CONSTRAINT "UserFederation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFederation" ADD CONSTRAINT "UserFederation_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "IdentityProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Object" ADD CONSTRAINT "Object_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
