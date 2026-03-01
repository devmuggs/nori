-- DropForeignKey
ALTER TABLE "UserRevision" DROP CONSTRAINT "UserRevision_userId_fkey";

-- AddForeignKey
ALTER TABLE "UserRevision" ADD CONSTRAINT "UserRevision_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
