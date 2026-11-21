-- AlterTable
ALTER TABLE "construction_project" ADD COLUMN     "categoryIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
