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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "formularios_adocao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "formularios_adocao_pedidoAdocaoId_key" ON "formularios_adocao"("pedidoAdocaoId");

-- AddForeignKey
ALTER TABLE "formularios_adocao" ADD CONSTRAINT "formularios_adocao_pedidoAdocaoId_fkey" FOREIGN KEY ("pedidoAdocaoId") REFERENCES "pedidos_adocao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
