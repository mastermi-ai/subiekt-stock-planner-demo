const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
    console.log("⏳ Sprawdzam najnowsze daty sprzedaży w całej bazie...");

    try {
        const lastSale = await prisma.sale.findFirst({
            orderBy: { date: 'desc' }
        });

        if (lastSale) {
            console.log(`✅ Ostatnia znana sprzedaż w bazie:`);
            console.log(`📅 Data: ${lastSale.date.toISOString()}`);
            console.log(`🔢 Ilość: ${lastSale.quantity}`);
            console.log(`🆔 ProductID: ${lastSale.productId}`);

            // Sprawdź czy jest coś z stycznia 2026
            const jan2026 = await prisma.sale.count({
                where: {
                    date: { gte: new Date('2026-01-01T00:00:00Z') }
                }
            });
            console.log(`📊 Liczba transakcji w Styczniu 2026: ${jan2026}`);

        } else {
            console.log("❌ Baza sprzedaży jest pusta!");
        }

    } catch (error) {
        console.error("Błąd:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
