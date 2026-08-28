-- AlterTable
ALTER TABLE "users" ADD COLUMN     "district" TEXT,
ADD COLUMN     "is_subscribed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "upazila" TEXT,
ADD COLUMN     "whatsapp_number" TEXT;
