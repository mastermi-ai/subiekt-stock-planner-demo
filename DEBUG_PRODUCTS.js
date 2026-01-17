const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
    console.log("🔍 Diagnostyka Tabeli Product...");

    // 1. Sprawdź ile jest produktów
    const count = await prisma.product.count();
    console.log(`📦 Liczba produktów w bazie: ${count}`);

    if (count === 0) {
        console.log("❌ TABELA PRODUKTÓW PUSTA!");
        return;
    }

    // 2. Pobierz 5 przykładowych
    const samples = await prisma.product.findMany({ take: 5 });
    console.log("\n📋 Przykładowe produkty:");
    samples.forEach(p => console.log(`   [ID: ${p.id}] SKU: '${p.sku}' | Nazwa: ${p.name.substring(0, 30)}...`));

    // 3. Szukaj '108178' (może ze spacjami?)
    const exact = await prisma.product.findFirst({ where: { sku: '108178' } });
    if (exact) console.log(`\n✅ Znaleziono strict '108178': ${exact.name}`);
    else console.log("\n❌ Nie znaleziono strict '108178'");

    // 4. Szukaj po nazwie "Trzewiki"
    const byName = await prisma.product.findMany({
        where: { name: { contains: 'Trzewiki', mode: 'insensitive' } },
        take: 5
    });

    if (byName.length > 0) {
        console.log(`\n✅ Znaleziono po nazwie 'Trzewiki' (${byName.length} wystąpień w top 5):`);
        byName.forEach(p => console.log(`   [ID: ${p.id}] SKU: '${p.sku}' | Nazwa: ${p.name}`));
    } else {
        console.log("\n❌ Nie znaleziono po nazwie 'Trzewiki'");
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
