/*
  Warnings:

  - You are about to drop the column `name` on the `UserRevision` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserRevision" DROP COLUMN "name",
ADD COLUMN     "displayName" TEXT;
