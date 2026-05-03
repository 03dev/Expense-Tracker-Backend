-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isTwoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;
