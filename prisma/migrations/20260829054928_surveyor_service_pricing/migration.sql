/*
  Warnings:

  - You are about to drop the column `starting_price` on the `services` table. All the data in the column will be lost.
  - You are about to drop the column `services` on the `surveyor_profiles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "services" DROP COLUMN "starting_price";

-- AlterTable
ALTER TABLE "surveyor_profiles" DROP COLUMN "services";

-- CreateTable
CREATE TABLE "surveyor_services" (
    "id" TEXT NOT NULL,
    "surveyor_profile_id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "starting_price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "surveyor_services_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "surveyor_services_service_id_idx" ON "surveyor_services"("service_id");

-- CreateIndex
CREATE UNIQUE INDEX "surveyor_services_surveyor_profile_id_service_id_key" ON "surveyor_services"("surveyor_profile_id", "service_id");

-- AddForeignKey
ALTER TABLE "surveyor_services" ADD CONSTRAINT "surveyor_services_surveyor_profile_id_fkey" FOREIGN KEY ("surveyor_profile_id") REFERENCES "surveyor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surveyor_services" ADD CONSTRAINT "surveyor_services_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
