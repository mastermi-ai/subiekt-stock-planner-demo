const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
    const TARGET_ID = 108178;
    const START_DATE = new Date('2025-11-01T00:00:00Z');
    const END_DATE = new Date('2026-01-09T23:59:59Z');

    console.log(`🔍 Weryfikacja Produktu (ID: ${TARGET_ID})`);
    console.log(`📅 Zakres Klienta: ${START_DATE.toISOString().split('T')[0]} do ${END_DATE.toISOString().split('T')[0]}`);

    try {
        const product = await prisma.product.findUnique({ where: { id: TARGET_ID } });
        if (!product) return console.log("❌ Brak produktu.");

        console.log(`✅ Produkt: ${product.name}`);
        console.log(`   (SKU: ${product.sku})`);

        // Pobierz wszystkie sprzedaże
        const allSales = await prisma.sale.findMany({ where: { productId: product.id } });

        // Filtruj po dacie klienta
        const filteredSales = allSales.filter(s => s.date >= START_DATE && s.date <= END_DATE);
        const filteredSum = filteredSales.reduce((sum, s) => sum + s.quantity, 0);

        // Suma całkowita (450 dni)
        const totalSum = allSales.reduce((sum, s) => sum + s.quantity, 0);

        // Stany
        const stocks = await prisma.stock.findMany({ where: { productId: product.id } });
        const physicalStock = stocks.reduce((sum, s) => sum + s.quantity, 0);
        const reservedStock = stocks.reduce((sum, s) => sum + s.reserved, 0);

        console.log("\n--------------------------------");
        console.log(`📊 WYNIKI:`);
        console.log(`💰 Sprzedaż (OKRES KLIENTA): ${filteredSum.toFixed(2)} (Oczekiwano: ~103)`);
        console.log(`💰 Sprzedaż (CAŁKOWITA):     ${totalSum.toFixed(2)} (Ostatnie 450 dni)`);
        console.log(`📦 Stan Fizyczny:            ${physicalStock} (Oczekiwano: 18)`);
        console.log(`🔒 Zarezerwowane:            ${reservedStock}`);
        console.log("--------------------------------");

        if (Math.abs(filteredSum - 103) < 2) {
            console.log("🏆 WYNIK W OKRESIE KLIENTA JEST POPRAWNY!");
        } else {
            const diff = 103 - filteredSum;
            console.log(`⚠️ Różnica w okresie klienta: ${diff.toFixed(2)}`);
        }

    } catch (error) {
        console.error("Błąd:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
