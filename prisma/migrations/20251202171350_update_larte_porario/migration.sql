/*
  Warnings:

  - You are about to drop the column `createdAt` on the `LarTemporario` table. All the data in the column will be lost.
  - You are about to drop the column `dataNascimento` on the `LarTemporario` table. All the data in the column will be lost.
  - You are about to drop the column `espacoDisponivel` on the `LarTemporario` table. All the data in the column will be lost.
  - You are about to drop the column `experiencia` on the `LarTemporario` table. All the data in the column will be lost.
  - You are about to drop the column `fotosResidencia` on the `LarTemporario` table. All the data in the column will be lost.
  - You are about to drop the column `possuiAnimais` on the `LarTemporario` table. All the data in the column will be lost.
  - You are about to drop the column `quaisAnimais` on the `LarTemporario` table. All the data in the column will be lost.
  - You are about to drop the column `tipoAnimalInteresse` on the `LarTemporario` table. All the data in the column will be lost.
  - You are about to drop the column `tipoResidencia` on the `LarTemporario` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `LarTemporario` table. All the data in the column will be lost.
  - Added the required column `administraMedicamentos` to the `LarTemporario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `declaroLido` to the `LarTemporario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `declaroVerdade` to the `LarTemporario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `outrosAnimais` to the `LarTemporario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quintal` to the `LarTemporario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `usuarioId` to the `LarTemporario` table without a default value. This is not possible if the table is not empty.
  - Made the column `nomeCompleto` on table `LarTemporario` required. This step will fail if there are existing NULL values in that column.
  - Made the column `cpf` on table `LarTemporario` required. This step will fail if there are existing NULL values in that column.
  - Made the column `telefone` on table `LarTemporario` required. This step will fail if there are existing NULL values in that column.
  - Made the column `email` on table `LarTemporario` required. This step will fail if there are existing NULL values in that column.
  - Made the column `endereco` on table `LarTemporario` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."LarTemporario" DROP CONSTRAINT "LarTemporario_userId_fkey";

-- AlterTable
ALTER TABLE "LarTemporario" DROP COLUMN "createdAt",
DROP COLUMN "dataNascimento",
DROP COLUMN "espacoDisponivel",
DROP COLUMN "experiencia",
DROP COLUMN "fotosResidencia",
DROP COLUMN "possuiAnimais",
DROP COLUMN "quaisAnimais",
DROP COLUMN "tipoAnimalInteresse",
DROP COLUMN "tipoResidencia",
DROP COLUMN "userId",
ADD COLUMN     "administraMedicamentos" BOOLEAN NOT NULL,
ADD COLUMN     "declaroLido" BOOLEAN NOT NULL,
ADD COLUMN     "declaroVerdade" BOOLEAN NOT NULL,
ADD COLUMN     "outrosAnimais" BOOLEAN NOT NULL,
ADD COLUMN     "quintal" BOOLEAN NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDENTE',
ADD COLUMN     "tipoAnimal" TEXT,
ADD COLUMN     "tipoMoradia" TEXT,
ADD COLUMN     "usuarioId" INTEGER NOT NULL,
ALTER COLUMN "nomeCompleto" SET NOT NULL,
ALTER COLUMN "cpf" SET NOT NULL,
ALTER COLUMN "telefone" SET NOT NULL,
ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "endereco" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "LarTemporario" ADD CONSTRAINT "LarTemporario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
