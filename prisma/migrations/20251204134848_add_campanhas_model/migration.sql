-- CreateTable
CREATE TABLE "campanhas" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "metaFinanceira" DECIMAL(10,2) NOT NULL,
    "valorArrecadado" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "dataLimite" TIMESTAMP(3) NOT NULL,
    "itensDescricao" TEXT[],
    "imagemUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ongId" INTEGER NOT NULL,

    CONSTRAINT "campanhas_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "campanhas" ADD CONSTRAINT "campanhas_ongId_fkey" FOREIGN KEY ("ongId") REFERENCES "Ong"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
