-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'ONG', 'PUBLICO');

-- CreateEnum
CREATE TYPE "StatusAdocao" AS ENUM ('DISPONIVEL', 'ADOTADO', 'SOBRE_TRATAMENTO');

-- CreateEnum
CREATE TYPE "StatusDenuncia" AS ENUM ('PENDENTE', 'EM_ANALISE', 'RESOLVIDA', 'REJEITADA');

-- CreateTable
CREATE TABLE "Account" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Publico" (
    "id" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,

    CONSTRAINT "Publico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ong" (
    "id" INTEGER NOT NULL,
    "name" TEXT,
    "cnpj" TEXT,
    "descricao" TEXT,
    "endereco" TEXT,

    CONSTRAINT "Ong_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Animal" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "especie" TEXT NOT NULL,
    "raca" TEXT,
    "idade" INTEGER,
    "status" "StatusAdocao" NOT NULL DEFAULT 'DISPONIVEL',
    "porte" TEXT,
    "sexo" TEXT,
    "descricao" TEXT,
    "photoURL" TEXT,
    "corPredominante" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "accountId" INTEGER NOT NULL,

    CONSTRAINT "Animal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Doacao" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "ongId" INTEGER NOT NULL,
    "valor" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Doacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LarTemporario" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "ongId" INTEGER NOT NULL,
    "animalId" INTEGER,
    "nomeCompleto" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "dataNascimento" TIMESTAMP(3) NOT NULL,
    "telefone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "tipoMoradia" TEXT NOT NULL,
    "possuiQuintal" BOOLEAN NOT NULL,
    "portesAceitos" TEXT NOT NULL,
    "especiesAceitas" TEXT NOT NULL,
    "possuiAnimais" BOOLEAN NOT NULL,
    "experiencia" TEXT,
    "dispoVeterinario" TEXT,
    "podeFornecerRacao" BOOLEAN NOT NULL,
    "precisaAjudaONG" BOOLEAN NOT NULL,
    "periodoDisponibilidade" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'EM_ANALISE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LarTemporario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fichas" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "photoURL" TEXT,
    "especie" TEXT NOT NULL,
    "raca" TEXT,
    "sexo" TEXT,
    "porte" TEXT,
    "dataNascimento" TIMESTAMP(3),
    "idade" INTEGER,
    "peso" DOUBLE PRECISION,
    "status" "StatusAdocao" NOT NULL DEFAULT 'DISPONIVEL',
    "saude" TEXT,
    "vacinas" TEXT,
    "vermifugos" TEXT,
    "castrado" BOOLEAN NOT NULL DEFAULT false,
    "alergias" TEXT,
    "medicacoes" TEXT,
    "ultimaConsulta" TIMESTAMP(3),
    "microchip" TEXT,
    "temperamento" TEXT NOT NULL,
    "socializacao" TEXT,
    "cuidados" TEXT,
    "nivelEnergia" INTEGER,
    "conviveCom" TEXT,
    "necessidadesEspeciais" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER,
    "animalId" INTEGER NOT NULL,

    CONSTRAINT "fichas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "denuncias" (
    "id" SERIAL NOT NULL,
    "descricao" TEXT NOT NULL,
    "localizacao" TEXT NOT NULL,
    "anonimo" BOOLEAN NOT NULL DEFAULT false,
    "contato" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER,
    "animalId" INTEGER,

    CONSTRAINT "denuncias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_email_key" ON "Account"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Publico_cpf_key" ON "Publico"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "fichas_microchip_key" ON "fichas"("microchip");

-- CreateIndex
CREATE UNIQUE INDEX "fichas_animalId_key" ON "fichas"("animalId");

-- AddForeignKey
ALTER TABLE "Admin" ADD CONSTRAINT "Admin_id_fkey" FOREIGN KEY ("id") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Publico" ADD CONSTRAINT "Publico_id_fkey" FOREIGN KEY ("id") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ong" ADD CONSTRAINT "Ong_id_fkey" FOREIGN KEY ("id") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Doacao" ADD CONSTRAINT "Doacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Doacao" ADD CONSTRAINT "Doacao_ongId_fkey" FOREIGN KEY ("ongId") REFERENCES "Ong"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LarTemporario" ADD CONSTRAINT "LarTemporario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LarTemporario" ADD CONSTRAINT "LarTemporario_ongId_fkey" FOREIGN KEY ("ongId") REFERENCES "Ong"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LarTemporario" ADD CONSTRAINT "LarTemporario_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fichas" ADD CONSTRAINT "fichas_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "denuncias" ADD CONSTRAINT "denuncias_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "denuncias" ADD CONSTRAINT "denuncias_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
