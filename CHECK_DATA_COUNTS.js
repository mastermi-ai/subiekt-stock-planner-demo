const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
    console.log("⏳ Łączenie z bazą danych (Render)...");
    try {
        const saleCount = await prisma.sale.count();
        const stockCount = await prisma.stock.count();

        console.log("\n==================================");
        console.log("  RAPORT STANU DANYCH (CHMURA)");
        console.log("==================================");
        console.log(`📦 Rekordy Stanów (Stock):   ${stockCount}`);
        console.log(`💰 Rekordy Sprzedaży (Sale): ${saleCount}`);
        console.log("==================================");

        if (saleCount > 100000 && stockCount > 3000) {
            console.log("✅ DANE SĄ W BAZIE! (Ilości zgadzają się z oczekiwaniami)");
        } else if (saleCount > 0) {
            console.log("⚠️ DANE SĄ, ALE MNIEJ NIŻ OCZEKIWANO.");
        } else {
            console.log("❌ BAZA PUSTA. Connector nie przesłał danych.");
        }

    } catch (error) {
        console.error("❌ Błąd połączenia z bazą:", error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
