-- CreateEnum
CREATE TYPE "LockerStatus" AS ENUM ('Available', 'Occupied', 'Maintenance');

-- CreateEnum
CREATE TYPE "LockerLocation" AS ENUM ('Male', 'Female', 'Kids');

-- CreateTable
CREATE TABLE "lockers" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "location" "LockerLocation" NOT NULL,
    "status" "LockerStatus" NOT NULL DEFAULT 'Available',
    "end_contract_date" TIMESTAMP(3),
    "member_id" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "lockers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "lockers" ADD CONSTRAINT "lockers_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
