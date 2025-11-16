-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "payment_fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "service_fee" DECIMAL(10,2) NOT NULL DEFAULT 0;
