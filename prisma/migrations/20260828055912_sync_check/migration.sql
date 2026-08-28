/*
  Warnings:

  - You are about to drop the column `created_at` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `is_subscribed` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `whatsapp_number` on the `users` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `whatsappNumber` to the `users` table without a default value. This is not possible if the table is not empty.
  - Made the column `district` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `phone` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `upazila` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "created_at",
DROP COLUMN "is_subscribed",
DROP COLUMN "updated_at",
DROP COLUMN "whatsapp_number",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isSubscribed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "whatsappNumber" TEXT NOT NULL,
ALTER COLUMN "district" SET NOT NULL,
ALTER COLUMN "district" DROP DEFAULT,
ALTER COLUMN "phone" SET NOT NULL,
ALTER COLUMN "phone" DROP DEFAULT,
ALTER COLUMN "upazila" SET NOT NULL,
ALTER COLUMN "upazila" DROP DEFAULT;
