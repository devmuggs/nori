/*
  Warnings:

  - You are about to drop the column `avatar_url` on the `UserRevision` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserRevision" DROP COLUMN "avatar_url",
ADD COLUMN     "avatar_object_id" TEXT;

-- AddForeignKey
ALTER TABLE "UserRevision" ADD CONSTRAINT "UserRevision_avatar_object_id_fkey" FOREIGN KEY ("avatar_object_id") REFERENCES "Object"("id") ON DELETE SET NULL ON UPDATE CASCADE;
