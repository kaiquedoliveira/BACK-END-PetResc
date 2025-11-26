/*
  Warnings:

  - You are about to drop the column `endereco` on the `Ong` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Ong" DROP COLUMN "endereco";

-- AddForeignKey
ALTER TABLE "LarTemporario" ADD CONSTRAINT "LarTemporario_aprovadoPorId_fkey" FOREIGN KEY ("aprovadoPorId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
