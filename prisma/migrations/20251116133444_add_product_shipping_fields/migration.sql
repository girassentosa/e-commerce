-- AlterTable
ALTER TABLE "products" ADD COLUMN     "default_shipping_cost" DECIMAL(10,2),
ADD COLUMN     "free_shipping_threshold" DECIMAL(10,2);
