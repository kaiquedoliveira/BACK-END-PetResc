/*
  Warnings:

  - You are about to drop the column `aprovadoPorId` on the `LarTemporario` table. All the data in the column will be lost.
  - You are about to drop the column `dispoVeterinario` on the `LarTemporario` table. All the data in the column will be lost.
  - You are about to drop the column `especiesAceitas` on the `LarTemporario` table. All the data in the column will be lost.
  - You are about to drop the column `podeFornecerRacao` on the `LarTemporario` table. All the data in the column will be lost.
  - You are about to drop the column `portesAceitos` on the `LarTemporario` table. All the data in the column will be lost.
  - You are about to drop the column `possuiQuintal` on the `LarTemporario` table. All the data in the column will be lost.
  - You are about to drop the column `precisaAjudaONG` on the `LarTemporario` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `LarTemporario` table. All the data in the column will be lost.
  - You are about to drop the column `tipoMoradia` on the `LarTemporario` table. All the data in the column will be lost.
  - You are about to drop the column `usuarioId` on the `LarTemporario` table. All the data in the column will be lost.
  - The `endereco` column on the `LarTemporario` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `ajudaSuprimentos` to the `LarTemporario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `arcarCustos` to the `LarTemporario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `levarVeterinario` to the `LarTemporario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `LarTemporario` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "StatusAdocao" ADD VALUE 'ADOTADO';

-- DropForeignKey
ALTER TABLE "public"."LarTemporario" DROP CONSTRAINT "LarTemporario_aprovadoPorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."LarTemporario" DROP CONSTRAINT "LarTemporario_ongId_fkey";

-- DropForeignKey
ALTER TABLE "public"."LarTemporario" DROP CONSTRAINT "LarTemporario_usuarioId_fkey";

-- AlterTable
ALTER TABLE "LarTemporario" DROP COLUMN "aprovadoPorId",
DROP COLUMN "dispoVeterinario",
DROP COLUMN "especiesAceitas",
DROP COLUMN "podeFornecerRacao",
DROP COLUMN "portesAceitos",
DROP COLUMN "possuiQuintal",
DROP COLUMN "precisaAjudaONG",
DROP COLUMN "status",
DROP COLUMN "tipoMoradia",
DROP COLUMN "usuarioId",
ADD COLUMN     "ajudaSuprimentos" BOOLEAN NOT NULL,
ADD COLUMN     "aprovadorId" INTEGER,
ADD COLUMN     "arcarCustos" BOOLEAN NOT NULL,
ADD COLUMN     "espacoDisponivel" TEXT,
ADD COLUMN     "fotosResidencia" JSONB,
ADD COLUMN     "levarVeterinario" BOOLEAN NOT NULL,
ADD COLUMN     "porteAnimal" TEXT,
ADD COLUMN     "quaisAnimais" TEXT,
ADD COLUMN     "tipoAnimalInteresse" TEXT,
ADD COLUMN     "tipoResidencia" TEXT,
ADD COLUMN     "userId" INTEGER NOT NULL,
ALTER COLUMN "ongId" DROP NOT NULL,
ALTER COLUMN "nomeCompleto" DROP NOT NULL,
ALTER COLUMN "cpf" DROP NOT NULL,
ALTER COLUMN "dataNascimento" DROP NOT NULL,
ALTER COLUMN "dataNascimento" SET DATA TYPE TEXT,
ALTER COLUMN "telefone" DROP NOT NULL,
ALTER COLUMN "email" DROP NOT NULL,
DROP COLUMN "endereco",
ADD COLUMN     "endereco" JSONB,
ALTER COLUMN "possuiAnimais" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "LarTemporario" ADD CONSTRAINT "LarTemporario_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LarTemporario" ADD CONSTRAINT "LarTemporario_aprovadorId_fkey" FOREIGN KEY ("aprovadorId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LarTemporario" ADD CONSTRAINT "LarTemporario_ongId_fkey" FOREIGN KEY ("ongId") REFERENCES "Ong"("id") ON DELETE SET NULL ON UPDATE CASCADE;
