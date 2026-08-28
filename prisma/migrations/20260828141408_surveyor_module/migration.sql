/*
  Warnings:

  - You are about to drop the column `googleId` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[google_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- DropIndex
DROP INDEX "users_googleId_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "googleId",
ADD COLUMN     "google_id" TEXT;

-- CreateTable
CREATE TABLE "service_areas" (
    "id" TEXT NOT NULL,
    "surveyor_profile_id" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "upazilas" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "service_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "starting_price" DOUBLE PRECISION DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "surveyor_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "bio" TEXT,
    "experience_years" INTEGER NOT NULL DEFAULT 0,
    "certificate_url" TEXT,
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMP(3),
    "admin_note" TEXT,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_reviews" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "services" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "surveyor_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "surveyor_reviews" (
    "id" TEXT NOT NULL,
    "surveyor_profile_id" TEXT NOT NULL,
    "reviewer_name" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "surveyor_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "service_areas_surveyor_profile_id_idx" ON "service_areas"("surveyor_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "services_slug_key" ON "services"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "surveyor_profiles_user_id_key" ON "surveyor_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "surveyor_profiles_slug_key" ON "surveyor_profiles"("slug");

-- CreateIndex
CREATE INDEX "surveyor_reviews_surveyor_profile_id_idx" ON "surveyor_reviews"("surveyor_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- AddForeignKey
ALTER TABLE "service_areas" ADD CONSTRAINT "service_areas_surveyor_profile_id_fkey" FOREIGN KEY ("surveyor_profile_id") REFERENCES "surveyor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surveyor_profiles" ADD CONSTRAINT "surveyor_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surveyor_reviews" ADD CONSTRAINT "surveyor_reviews_surveyor_profile_id_fkey" FOREIGN KEY ("surveyor_profile_id") REFERENCES "surveyor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
