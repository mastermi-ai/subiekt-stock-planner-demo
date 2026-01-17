const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
    const TARGET_ID = 108178;

    try {
        const product = await prisma.product.findUnique({ where: { id: TARGET_ID } });
        if (!product) return console.log("❌ Brak produktu.");

        console.log(`📦 Produkt: ${product.name}`);

        // Pobierz stany z rozwinięciem relacji Branch
        const stocks = await prisma.stock.findMany({
            where: { productId: TARGET_ID },
            include: { branch: true }
        });

        console.log(`\n🏭 LOKALIZACJA STANÓW (${stocks.length} wpisów):`);

        if (stocks.length === 0) {
            console.log("❌ TABELA STOCK JEST PUSTA DLA TEGO PRODUKTU!");
        } else {
            stocks.forEach(s => {
                console.log(`   📍 Oddział: [${s.branch.name}] (Symbol: ${s.branch.symbol})`);
                console.log(`      ➡️ Fizyczny:     ${s.quantity}`);
                console.log(`      🔒 Zarezerwowany: ${s.reserved}`);
                console.log(`      ✅ Dostępny:      ${s.quantity - s.reserved}`);
                console.log("-----------------------------------------");
            });
        }

    } catch (error) {
        console.error("Błąd:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
