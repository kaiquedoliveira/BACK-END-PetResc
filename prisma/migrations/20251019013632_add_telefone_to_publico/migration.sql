/*
  Warnings:

  - You are about to drop the column `name` on the `Ong` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "telefone" TEXT;

-- AlterTable
ALTER TABLE "Ong" DROP COLUMN "name",
ADD COLUMN     "nome" TEXT;
