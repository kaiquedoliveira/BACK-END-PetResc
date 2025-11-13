const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs'); 

const prisma = new PrismaClient();

async function main() {
    console.log('Iniciando o seed script...');
    const adminEmail = 'admin@petresc.com';
    
    const hashedPassword = await bcrypt.hash('admin123', 10); 

    const adminAccount = await prisma.account.findUnique({ where: { email: adminEmail } });
    if (adminAccount) {
        await prisma.account.delete({ where: { email: adminEmail } });
        console.log('Registros antigos do admin limpos.');
    }

    const newAccount = await prisma.account.create({
        data: {
            email: adminEmail,
            password: hashedPassword,
            role: 'ADMIN',
            
            // --- CORREÇÕES AQUI ---
            nome: 'Administrador',      
            cpf: '000.000.000-00',     
            telefone: '999999999',    
            admin: {
                create: {
                    nome: 'Administrador', 
                },
            },
            publico: { create: {} },
            ong: { create: {} }
        },
    });

    console.log(`Conta de admin criada com sucesso: ${newAccount.email}`);
}

main()
    .catch((e) => {
        console.error('Erro ao executar o seed script:');
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });