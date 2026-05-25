-- DropForeignKey
ALTER TABLE "disciplines" DROP CONSTRAINT "disciplines_member_id_fkey";

-- AlterTable
ALTER TABLE "disciplines" ALTER COLUMN "member_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "disciplines" ADD CONSTRAINT "disciplines_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
