const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
    const TARGET_ID = 108178;

    const sales = await prisma.sale.findMany({
        where: { productId: TARGET_ID },
        orderBy: { date: 'asc' }
    });

    const totalSold = sales.reduce((sum, s) => sum + s.quantity, 0);

    console.log(`📊 Analiza Sprzedaży dla ID ${TARGET_ID}:`);
    console.log(`📦 Liczba transakcji: ${sales.length}`);
    console.log(`💰 Suma ilości:      ${totalSold}`);

    if (sales.length > 0) {
        console.log(`📅 Pierwsza sprzedaż: ${sales[0].date.toISOString()}`);
        console.log(`📅 Ostatnia sprzedaż: ${sales[sales.length - 1].date.toISOString()}`);
    } else {
        console.log("❌ Brak sprzedaży w bazie.");
    }
}

main().finally(async () => await prisma.$disconnect());
