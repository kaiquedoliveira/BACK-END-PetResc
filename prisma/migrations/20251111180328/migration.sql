/*
  Warnings:

  - The values [ADOTADO,SOBRE_TRATAMENTO] on the enum `StatusAdocao` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "StatusAdocao_new" AS ENUM ('PERDIDO', 'ENCONTRADO', 'DISPONIVEL');
ALTER TABLE "public"."Animal" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."fichas" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Animal" ALTER COLUMN "status" TYPE "StatusAdocao_new" USING ("status"::text::"StatusAdocao_new");
ALTER TABLE "fichas" ALTER COLUMN "status" TYPE "StatusAdocao_new" USING ("status"::text::"StatusAdocao_new");
ALTER TYPE "StatusAdocao" RENAME TO "StatusAdocao_old";
ALTER TYPE "StatusAdocao_new" RENAME TO "StatusAdocao";
DROP TYPE "public"."StatusAdocao_old";
ALTER TABLE "Animal" ALTER COLUMN "status" SET DEFAULT 'DISPONIVEL';
ALTER TABLE "fichas" ALTER COLUMN "status" SET DEFAULT 'DISPONIVEL';
COMMIT;
