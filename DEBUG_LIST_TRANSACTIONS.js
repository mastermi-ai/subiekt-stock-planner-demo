const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
    const TARGET_ID = 108178;
    const START_DATE = new Date('2025-11-01T00:00:00Z');
    const END_DATE = new Date('2026-01-09T23:59:59Z');

    console.log(`🔍 Weryfikacja Detaliczna (ID: ${TARGET_ID})`);

    try {
        const product = await prisma.product.findUnique({ where: { id: TARGET_ID } });
        if (!product) return console.log("❌ Brak produktu.");

        console.log(`📦 Produkt: ${product.name}`);

        // ------ STANY ------
        const stocks = await prisma.stock.findMany({
            where: { productId: TARGET_ID },
            include: { branch: true }
        });

        console.log(`\n📦 PODZIAŁ STANÓW (${stocks.length} rekordów):`);
        let totalPhys = 0;

        if (stocks.length === 0) console.log("   ❌ BRAK STANÓW W BAZIE! (Tabela Stock pusta dla tego ID)");

        stocks.forEach(s => {
            const avail = s.quantity - s.reserved;
            console.log(`   🔸 [${s.branch.name}] Fiz: ${s.quantity}, Rez: ${s.reserved} => Dost: ${avail}`);
            totalPhys += s.quantity;
        });
        console.log(`   SUMA: ${totalPhys}`);

        // ------ SPRZEDAŻ (SZCZEGÓŁY) ------
        const allSales = await prisma.sale.findMany({
            where: {
                productId: TARGET_ID,
                date: { gte: START_DATE, lte: END_DATE }
            },
            orderBy: { date: 'asc' }
        });

        console.log(`\n💰 LISTA TRANSAKCJI (${allSales.length} poz.):`);
        let runningTotal = 0;

        allSales.forEach((s, i) => {
            runningTotal += s.quantity;
            console.log(`   ${i + 1}. [${s.date.toISOString().split('T')[0]}] Ilość: ${s.quantity} (DokID: ${s.documentId})`);
        });
        console.log(`   SUMA: ${runningTotal.toFixed(2)}`);

    } catch (error) {
        console.error("Błąd:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
