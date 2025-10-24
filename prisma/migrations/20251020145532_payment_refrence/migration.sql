-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN     "paymentReference" TEXT;

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "public"."Order"("userId");

-- CreateIndex
CREATE INDEX "Order_restaurantId_idx" ON "public"."Order"("restaurantId");

-- CreateIndex
CREATE INDEX "Order_paymentReference_idx" ON "public"."Order"("paymentReference");
