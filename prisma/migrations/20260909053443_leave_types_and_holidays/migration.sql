/*
  Warnings:

  - You are about to drop the column `type` on the `LeaveRequest` table. All the data in the column will be lost.
  - Added the required column `leaveTypeId` to the `LeaveRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "LeaveRequest" DROP COLUMN "type",
ADD COLUMN     "leaveTypeId" TEXT NOT NULL;

-- DropEnum
DROP TYPE "LeaveType";

-- CreateTable
CREATE TABLE "LeaveTypeConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "defaultAllocation" INTEGER NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveTypeConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicHoliday" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicHoliday_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LeaveTypeConfig_name_key" ON "LeaveTypeConfig"("name");

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "LeaveTypeConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
