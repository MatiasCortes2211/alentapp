-- DropForeignKey
ALTER TABLE "medical_certificates" DROP CONSTRAINT "medical_certificates_member_id_fkey";

-- AddForeignKey
ALTER TABLE "medical_certificates" ADD CONSTRAINT "medical_certificates_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
