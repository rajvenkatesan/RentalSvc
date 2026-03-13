-- CreateEnum
CREATE TYPE "RentalStatus" AS ENUM ('pending', 'active', 'completed', 'cancelled');

-- AlterTable: Add username column with temporary default, then make unique
ALTER TABLE "User" ADD COLUMN "username" TEXT;
UPDATE "User" SET "username" = LOWER(SPLIT_PART("email", '@', 1));
ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateTable
CREATE TABLE "BlockedDay" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "rentableItemId" UUID NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,

    CONSTRAINT "BlockedDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rental" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "rentableItemId" UUID NOT NULL,
    "renterId" UUID NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalCost" DECIMAL(10,2) NOT NULL,
    "status" "RentalStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rental_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BlockedDay" ADD CONSTRAINT "BlockedDay_rentableItemId_fkey" FOREIGN KEY ("rentableItemId") REFERENCES "RentableItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_rentableItemId_fkey" FOREIGN KEY ("rentableItemId") REFERENCES "RentableItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_renterId_fkey" FOREIGN KEY ("renterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
