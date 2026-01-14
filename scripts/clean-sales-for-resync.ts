import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanDatabase() {
    console.log('🧹 CLEANING DATABASE...\n');

    // Delete ALL sales to force clean re-sync
    const deleted = await prisma.sale.deleteMany({});

    console.log(`✅ Deleted ${deleted.count} sales records`);
    console.log('Database is clean. Connector will re-sync from scratch.\n');

    await prisma.$disconnect();
}

cleanDatabase().catch(e => {
    console.error(e);
    process.exit(1);
});
