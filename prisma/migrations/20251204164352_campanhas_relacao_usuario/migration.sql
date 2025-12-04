-- DropForeignKey
ALTER TABLE "public"."campanhas" DROP CONSTRAINT "campanhas_ongId_fkey";

-- AlterTable
ALTER TABLE "campanhas" ADD COLUMN     "usuarioCriadorId" INTEGER,
ALTER COLUMN "ongId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "campanhas" ADD CONSTRAINT "campanhas_usuarioCriadorId_fkey" FOREIGN KEY ("usuarioCriadorId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campanhas" ADD CONSTRAINT "campanhas_ongId_fkey" FOREIGN KEY ("ongId") REFERENCES "Ong"("id") ON DELETE SET NULL ON UPDATE CASCADE;
