-- CreateTable
CREATE TABLE "Shift" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "maxMembers" INTEGER,
    "currentMembers" INTEGER NOT NULL DEFAULT 0,
    "gymId" INTEGER NOT NULL,
    "trainerId" INTEGER,
    "dayOfWeek" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "price" DOUBLE PRECISION,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "bookingRequired" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Shift_gymId_idx" ON "Shift"("gymId");

-- CreateIndex
CREATE INDEX "Shift_trainerId_idx" ON "Shift"("trainerId");

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Trainer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
