-- DropForeignKey
ALTER TABLE "BlockedDay" DROP CONSTRAINT "BlockedDay_rentableItemId_fkey";

-- DropForeignKey
ALTER TABLE "CartItem" DROP CONSTRAINT "CartItem_cartId_fkey";

-- DropForeignKey
ALTER TABLE "CartItem" DROP CONSTRAINT "CartItem_rentableItemId_fkey";

-- DropForeignKey
ALTER TABLE "RentableItem" DROP CONSTRAINT "RentableItem_itemId_fkey";

-- DropForeignKey
ALTER TABLE "Rental" DROP CONSTRAINT "Rental_rentableItemId_fkey";

-- AddForeignKey
ALTER TABLE "RentableItem" ADD CONSTRAINT "RentableItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedDay" ADD CONSTRAINT "BlockedDay_rentableItemId_fkey" FOREIGN KEY ("rentableItemId") REFERENCES "RentableItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_rentableItemId_fkey" FOREIGN KEY ("rentableItemId") REFERENCES "RentableItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_rentableItemId_fkey" FOREIGN KEY ("rentableItemId") REFERENCES "RentableItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
