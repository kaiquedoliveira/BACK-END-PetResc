/*
  Warnings:

  - You are about to drop the `animal` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `animal` DROP FOREIGN KEY `Animal_ongId_fkey`;

-- DropTable
DROP TABLE `animal`;

-- CreateTable
CREATE TABLE `animals` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `especie` VARCHAR(191) NOT NULL,
    `raca` VARCHAR(191) NULL,
    `idade` INTEGER NULL,
    `status` ENUM('DISPONIVEL', 'ADOTADO', 'SOBRE_TRATAMENTO') NOT NULL DEFAULT 'DISPONIVEL',
    `porte` VARCHAR(191) NULL,
    `sexo` VARCHAR(191) NULL,
    `descricao` VARCHAR(191) NULL,
    `photoURL` VARCHAR(191) NULL,
    `ongId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `animals` ADD CONSTRAINT `animals_ongId_fkey` FOREIGN KEY (`ongId`) REFERENCES `Ong`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
