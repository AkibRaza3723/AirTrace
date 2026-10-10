-- CreateEnum
CREATE TYPE "Profession" AS ENUM ('STUDENT', 'PROFESSIONAL');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "preferredAddress" TEXT,
ADD COLUMN     "preferredLat" DOUBLE PRECISION,
ADD COLUMN     "preferredLng" DOUBLE PRECISION,
ADD COLUMN     "profession" "Profession" NOT NULL DEFAULT 'STUDENT';

-- CreateTable
CREATE TABLE "campus_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "campusName" TEXT NOT NULL,
    "campusLatitude" DOUBLE PRECISION NOT NULL,
    "campusLongitude" DOUBLE PRECISION NOT NULL,
    "campusAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campus_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "campus_profiles_userId_key" ON "campus_profiles"("userId");

-- AddForeignKey
ALTER TABLE "campus_profiles" ADD CONSTRAINT "campus_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
