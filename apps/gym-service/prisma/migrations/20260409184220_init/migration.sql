/*
  Warnings:

  - You are about to drop the column `created_at` on the `Membership` table. All the data in the column will be lost.
  - You are about to drop the column `duration_in_days` on the `Membership` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `gym_classes` table. All the data in the column will be lost.
  - You are about to drop the column `end_time` on the `gym_classes` table. All the data in the column will be lost.
  - You are about to drop the column `max_capacity` on the `gym_classes` table. All the data in the column will be lost.
  - You are about to drop the column `start_time` on the `gym_classes` table. All the data in the column will be lost.
  - You are about to drop the column `trainer_id` on the `gym_classes` table. All the data in the column will be lost.
  - You are about to drop the `subscription` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `durationInDays` to the `Membership` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endTime` to the `gym_classes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maxCapacity` to the `gym_classes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `gym_classes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trainerPk` to the `gym_classes` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('CONFIRMED', 'CANCELLED', 'ATTENDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'UPI');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('SUCCESS', 'PENDING', 'FAILED', 'REFUNDED');

-- DropForeignKey
ALTER TABLE "subscription" DROP CONSTRAINT "subscription_plan_id_fkey";

-- AlterTable
ALTER TABLE "Membership" DROP COLUMN "created_at",
DROP COLUMN "duration_in_days",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "durationInDays" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "gym_classes" DROP COLUMN "created_at",
DROP COLUMN "end_time",
DROP COLUMN "max_capacity",
DROP COLUMN "start_time",
DROP COLUMN "trainer_id",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "endTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "maxCapacity" INTEGER NOT NULL,
ADD COLUMN     "startTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "trainerPk" INTEGER NOT NULL;

-- DropTable
DROP TABLE "subscription";

-- CreateTable
CREATE TABLE "Subscription" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "planId" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassBooking" (
    "id" SERIAL NOT NULL,
    "classId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "bookingStatus" "BookingStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance" (
    "id" SERIAL NOT NULL,
    "gymId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "checkInTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkOutTime" TIMESTAMP(3),

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "subscriptionId" INTEGER,
    "amount" INTEGER NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trainer" (
    "id" SERIAL NOT NULL,
    "trainerId" INTEGER NOT NULL,
    "specialization" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "hourlyRate" INTEGER NOT NULL,

    CONSTRAINT "Trainer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainerGym" (
    "id" SERIAL NOT NULL,
    "trainerPk" INTEGER NOT NULL,
    "gymId" INTEGER NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainerGym_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClassBooking_classId_userId_key" ON "ClassBooking"("classId", "userId");

-- CreateIndex
CREATE INDEX "attendance_gymId_idx" ON "attendance"("gymId");

-- CreateIndex
CREATE INDEX "attendance_userId_idx" ON "attendance"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Trainer_trainerId_key" ON "Trainer"("trainerId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainerGym_trainerPk_gymId_key" ON "TrainerGym"("trainerPk", "gymId");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Membership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gym_classes" ADD CONSTRAINT "gym_classes_trainerPk_fkey" FOREIGN KEY ("trainerPk") REFERENCES "Trainer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassBooking" ADD CONSTRAINT "ClassBooking_classId_fkey" FOREIGN KEY ("classId") REFERENCES "gym_classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainerGym" ADD CONSTRAINT "TrainerGym_trainerPk_fkey" FOREIGN KEY ("trainerPk") REFERENCES "Trainer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainerGym" ADD CONSTRAINT "TrainerGym_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
