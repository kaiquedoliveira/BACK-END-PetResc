/*
  Warnings:

  - You are about to drop the column `cpf` on the `Publico` table. All the data in the column will be lost.
  - You are about to drop the column `nome` on the `Publico` table. All the data in the column will be lost.
  - You are about to drop the column `telefone` on the `Publico` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[cpf]` on the table `Account` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `cpf` to the `Account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nome` to the `Account` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."Publico_cpf_key";

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "cpf" TEXT NOT NULL,
ADD COLUMN     "nome" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Publico" DROP COLUMN "cpf",
DROP COLUMN "nome",
DROP COLUMN "telefone";

-- CreateIndex
CREATE UNIQUE INDEX "Account_cpf_key" ON "Account"("cpf");
