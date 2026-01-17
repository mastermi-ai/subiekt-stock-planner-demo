const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
    const TARGET_ID = 108178;
    const START_DATE = new Date('2025-11-01T00:00:00Z');
    const END_DATE = new Date('2026-01-09T23:59:59Z');

    try {
        const product = await prisma.product.findUnique({ where: { id: TARGET_ID } });
        if (!product) return console.log("❌ Brak produktu.");

        console.log(`📦 Produkt: ${product.name}`);

        // Pobierz sprzedaż w okresie
        const sales = await prisma.sale.findMany({
            where: {
                productId: TARGET_ID,
                date: { gte: START_DATE, lte: END_DATE }
            },
            include: { branch: true }
        });

        console.log(`\n💰 SPRZEDAŻ WEDŁUG ODDZIAŁÓW (${sales.length} transakcji):`);

        // Grupuj po branchId
        const byBranch = {};
        sales.forEach(s => {
            const bName = s.branch ? s.branch.name : `ID: ${s.branchId}`;
            if (!byBranch[bName]) byBranch[bName] = 0;
            byBranch[bName] += s.quantity;
        });

        // Wyświetl
        for (const [name, qty] of Object.entries(byBranch)) {
            console.log(`   🔸 Oddział '${name}': ${qty.toFixed(2)}`);
        }

        const total = Object.values(byBranch).reduce((sum, q) => sum + q, 0);
        console.log(`\n   SUMA CAŁKOWITA: ${total.toFixed(2)}`);

    } catch (error) {
        console.error("Błąd:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
