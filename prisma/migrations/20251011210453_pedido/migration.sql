/*
  Warnings:

  - You are about to drop the `denuncias` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "StatusPedido" AS ENUM ('PENDENTE', 'APROVADO', 'RECUSADO');

-- DropForeignKey
ALTER TABLE "public"."denuncias" DROP CONSTRAINT "denuncias_animalId_fkey";

-- DropForeignKey
ALTER TABLE "public"."denuncias" DROP CONSTRAINT "denuncias_createdBy_fkey";

-- DropTable
DROP TABLE "public"."denuncias";

-- DropEnum
DROP TYPE "public"."StatusDenuncia";

-- CreateTable
CREATE TABLE "pedidos_adocao" (
    "id" SERIAL NOT NULL,
    "status" "StatusPedido" NOT NULL DEFAULT 'PENDENTE',
    "dataPedido" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "animalId" INTEGER NOT NULL,
    "candidatoId" INTEGER NOT NULL,

    CONSTRAINT "pedidos_adocao_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "pedidos_adocao" ADD CONSTRAINT "pedidos_adocao_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_adocao" ADD CONSTRAINT "pedidos_adocao_candidatoId_fkey" FOREIGN KEY ("candidatoId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
