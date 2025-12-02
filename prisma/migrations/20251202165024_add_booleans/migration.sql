/*
  Warnings:

  - The `experiencia` column on the `LarTemporario` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `espacoDisponivel` column on the `LarTemporario` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "LarTemporario" DROP COLUMN "experiencia",
ADD COLUMN     "experiencia" BOOLEAN,
DROP COLUMN "espacoDisponivel",
ADD COLUMN     "espacoDisponivel" BOOLEAN;
