-- CreateEnum
CREATE TYPE "ApartmentStatus" AS ENUM ('Available', 'leased');

-- AlterTable
ALTER TABLE "apartments" ADD COLUMN     "status" "ApartmentStatus" NOT NULL DEFAULT 'Available';
