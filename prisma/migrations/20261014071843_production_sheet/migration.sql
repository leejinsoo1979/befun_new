-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'FACTORY';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "productionReadyAt" TIMESTAMP(3),
ADD COLUMN     "productionSheet" JSONB;
