/*
  Warnings:

  - You are about to drop the column `ongId` on the `animal` table. All the data in the column will be lost.
  - Added the required column `accountId` to the `Animal` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `animal` DROP FOREIGN KEY `Animal_ongId_fkey`;

-- DropForeignKey
ALTER TABLE `denuncias` DROP FOREIGN KEY `denuncias_animalId_fkey`;

-- DropIndex
DROP INDEX `Animal_ongId_fkey` ON `animal`;

-- DropIndex
DROP INDEX `denuncias_animalId_fkey` ON `denuncias`;

-- AlterTable
ALTER TABLE `animal` DROP COLUMN `ongId`,
    ADD COLUMN `accountId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `denuncias` MODIFY `animalId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Animal` ADD CONSTRAINT `Animal_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `Account`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `denuncias` ADD CONSTRAINT `denuncias_animalId_fkey` FOREIGN KEY (`animalId`) REFERENCES `Animal`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
