-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'ONG', 'PUBLICO');

-- CreateEnum
CREATE TYPE "StatusAdocao" AS ENUM ('PERDIDO', 'ENCONTRADO', 'DISPONIVEL', 'ADOTADO');

-- CreateEnum
CREATE TYPE "StatusPedido" AS ENUM ('PENDENTE', 'APROVADO', 'RECUSADO');

-- CreateTable
CREATE TABLE "Account" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "telefone" TEXT,
    "animaisVistosRecentemente" TEXT[],
    "cep" TEXT,
    "rua" TEXT,
    "numero" TEXT,
    "complemento" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),

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

    CONSTRAINT "Publico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ong" (
    "id" INTEGER NOT NULL,
    "nome" TEXT,
    "cnpj" TEXT,
    "descricao" TEXT,
    "cep" TEXT,
    "rua" TEXT,
    "numero" TEXT,
    "complemento" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "estado" TEXT,

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
    "dataResgate" TIMESTAMP(3),
    "local_estado" TEXT,
    "local_cidade" TEXT,
    "local_numero" TEXT,
    "tinhaFilhotes" BOOLEAN,
    "tinhaColeira" BOOLEAN,
    "motivoNaoDisponivel" TEXT,
    "localAtual" TEXT,
    "imagemResgateURL" TEXT,
    "cuidadosVeterinarios" TEXT,
    "vermifugado" BOOLEAN,
    "dataVermifugado" TIMESTAMP(3),
    "vacinado" BOOLEAN,
    "vacinasTexto" TEXT,
    "castrado" BOOLEAN,
    "dataCastrado" TIMESTAMP(3),
    "testadoDoencas" BOOLEAN,
    "testesTexto" TEXT,
    "resultadosTestes" TEXT,
    "sociabilidade" TEXT,
    "accountId" INTEGER NOT NULL,

    CONSTRAINT "Animal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notificacao" (
    "id" TEXT NOT NULL,
    "accountId" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "tipo" TEXT,
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notificacao_pkey" PRIMARY KEY ("id")
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
    "aprovadorId" INTEGER,
    "ongId" INTEGER,
    "animalId" INTEGER,
    "nomeCompleto" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "endereco" JSONB NOT NULL,
    "tipoMoradia" TEXT,
    "quintal" BOOLEAN NOT NULL,
    "porteAnimal" TEXT,
    "tipoAnimal" TEXT,
    "outrosAnimais" BOOLEAN NOT NULL,
    "administraMedicamentos" BOOLEAN NOT NULL,
    "levarVeterinario" BOOLEAN NOT NULL,
    "arcarCustos" BOOLEAN NOT NULL,
    "ajudaSuprimentos" BOOLEAN NOT NULL,
    "periodoDisponibilidade" TEXT NOT NULL,
    "declaroVerdade" BOOLEAN NOT NULL,
    "declaroLido" BOOLEAN NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',

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
CREATE TABLE "pedidos_adocao" (
    "id" SERIAL NOT NULL,
    "status" "StatusPedido" NOT NULL DEFAULT 'PENDENTE',
    "dataPedido" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "animalId" INTEGER NOT NULL,
    "candidatoId" INTEGER NOT NULL,

    CONSTRAINT "pedidos_adocao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "formularios_adocao" (
    "id" SERIAL NOT NULL,
    "pedidoAdocaoId" INTEGER NOT NULL,
    "tipoMoradia" TEXT NOT NULL,
    "possuiQuintal" BOOLEAN NOT NULL,
    "quintalTelado" BOOLEAN,
    "janelasTeladas" BOOLEAN,
    "moradiaPropria" BOOLEAN NOT NULL,
    "pessoasNaCasa" INTEGER NOT NULL,
    "todosConcordam" BOOLEAN NOT NULL,
    "criancasEmCasa" BOOLEAN NOT NULL,
    "alergias" BOOLEAN NOT NULL,
    "horasSozinho" INTEGER NOT NULL,
    "rotinaPasseios" TEXT,
    "quemCuidara" TEXT NOT NULL,
    "possuiOutrosAnimais" BOOLEAN NOT NULL,
    "historicoAnimais" TEXT,
    "teveAnimaisAntes" BOOLEAN NOT NULL,
    "temVeterinario" BOOLEAN,
    "cienteCustos" BOOLEAN NOT NULL,
    "motivoAdocao" TEXT NOT NULL,
    "observacoes" TEXT,
    "cep" TEXT,
    "rua" TEXT,
    "numero" TEXT,
    "complemento" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "formularios_adocao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorito" (
    "usuarioId" INTEGER NOT NULL,
    "animalId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorito_pkey" PRIMARY KEY ("usuarioId","animalId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_email_key" ON "Account"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_cpf_key" ON "Account"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "fichas_microchip_key" ON "fichas"("microchip");

-- CreateIndex
CREATE UNIQUE INDEX "fichas_animalId_key" ON "fichas"("animalId");

-- CreateIndex
CREATE UNIQUE INDEX "formularios_adocao_pedidoAdocaoId_key" ON "formularios_adocao"("pedidoAdocaoId");

-- AddForeignKey
ALTER TABLE "Admin" ADD CONSTRAINT "Admin_id_fkey" FOREIGN KEY ("id") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Publico" ADD CONSTRAINT "Publico_id_fkey" FOREIGN KEY ("id") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ong" ADD CONSTRAINT "Ong_id_fkey" FOREIGN KEY ("id") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Doacao" ADD CONSTRAINT "Doacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Doacao" ADD CONSTRAINT "Doacao_ongId_fkey" FOREIGN KEY ("ongId") REFERENCES "Ong"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LarTemporario" ADD CONSTRAINT "LarTemporario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LarTemporario" ADD CONSTRAINT "LarTemporario_aprovadorId_fkey" FOREIGN KEY ("aprovadorId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LarTemporario" ADD CONSTRAINT "LarTemporario_ongId_fkey" FOREIGN KEY ("ongId") REFERENCES "Ong"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LarTemporario" ADD CONSTRAINT "LarTemporario_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fichas" ADD CONSTRAINT "fichas_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_adocao" ADD CONSTRAINT "pedidos_adocao_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_adocao" ADD CONSTRAINT "pedidos_adocao_candidatoId_fkey" FOREIGN KEY ("candidatoId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formularios_adocao" ADD CONSTRAINT "formularios_adocao_pedidoAdocaoId_fkey" FOREIGN KEY ("pedidoAdocaoId") REFERENCES "pedidos_adocao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorito" ADD CONSTRAINT "Favorito_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorito" ADD CONSTRAINT "Favorito_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
