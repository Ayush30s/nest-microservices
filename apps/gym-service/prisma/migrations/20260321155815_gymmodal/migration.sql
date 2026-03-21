-- CreateTable
CREATE TABLE "gym" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "username" TEXT NOT NULL,

    CONSTRAINT "gym_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gym_email_key" ON "gym"("email");

-- CreateIndex
CREATE UNIQUE INDEX "gym_username_key" ON "gym"("username");
