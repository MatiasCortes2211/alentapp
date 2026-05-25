-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_member_id_fkey";

-- AlterTable
ALTER TABLE "payments" ALTER COLUMN "member_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
