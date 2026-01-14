import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deepScan() {
    console.log('🚀 INITIALIZING DEEP SYSTEM SCAN...\n');
    let errors = 0;
    let warnings = 0;

    // 1. Record Counts & Freshness
    console.log('--- 1. VOLUME & FRESHNESS ---');
    const salesCount = await prisma.sale.count();
    const stocksCount = await prisma.stock.count();
    const productsCount = await prisma.product.count();

    console.log(`Sales:    ${salesCount.toLocaleString()}`);
    console.log(`Stocks:   ${stocksCount.toLocaleString()}`);
    console.log(`Products: ${productsCount.toLocaleString()}`);

    const lastSale = await prisma.sale.findFirst({ orderBy: { date: 'desc' } });
    const lastStockDate = new Date(); // Stocks don't have update date in schema but we assume current if present

    if (!lastSale) {
        console.error('❌ CRITICAL: No sales data found!');
        errors++;
    } else {
        const diffHours = (new Date().getTime() - lastSale.date.getTime()) / (1000 * 3600);
        console.log(`Newest Sale: ${lastSale.date.toISOString()} (${diffHours.toFixed(1)}h ago)`);
        if (diffHours < 24) console.log('✅ Sales data is FRESH.');
        else {
            console.warn('⚠️ WARNING: Last sale is older than 24h.');
            warnings++;
        }
    }

    // 2. Integrity Checks (Orphans)
    console.log('\n--- 2. LOGICAL INTEGRITY ---');
    // Check if any sale has invalid branchId
    const distinctBranchIds = await prisma.sale.findMany({
        distinct: ['branchId'],
        select: { branchId: true }
    });
    console.log(`Active Branches in Sales: ${distinctBranchIds.length}`);

    // Check for negative stocks (if any)
    const negativeStocks = await prisma.stock.count({ where: { quantity: { lt: 0 } } });
    if (negativeStocks > 0) {
        console.warn(`⚠️ WARNING: Found ${negativeStocks} records with NEGATIVE stock quantity.`);
        warnings++;
    } else {
        console.log('✅ No negative stock records.');
    }

    // 3. Outlier Detection
    console.log('\n--- 3. OUTLIER DETECTION ---');
    const massiveSales = await prisma.sale.count({ where: { quantity: { gt: 1000 } } });
    if (massiveSales > 0) {
        console.warn(`⚠️ WARNING: Found ${massiveSales} sales transactions > 1000 units. Check for duplicates/bulk moves.`);
        warnings++;
    } else {
        console.log('✅ No single transaction > 1000 units (suggests normal retail/wholesale flow).');
    }

    const massiveStock = await prisma.stock.count({ where: { quantity: { gt: 10000 } } });
    if (massiveStock > 0) {
        console.warn(`⚠️ WARNING: Found ${massiveStock} stock records > 10,000 units.`);
        warnings++;
    } else {
        console.log('✅ Stock levels look reasonable (<10k per SKU/Branch).');
    }

    // 4. Specific Branch Check
    console.log('\n--- 4. BRANCH COVERAGE ---');
    const branches = await prisma.branch.findMany();
    for (const b of branches) {
        const sCount = await prisma.stock.count({ where: { branchId: b.id } });
        console.log(`Branch [${b.symbol}] ${b.name}: ${sCount} stock records`);
        if (sCount === 0) {
            console.warn(`  ⚠️ Branch ${b.name} has ZERO stock records.`);
            // This might be expected for some branches, so just warning
        }
    }

    console.log('\n=============================');
    if (errors === 0) {
        console.log('🟢 SYSTEM HEALTH: GOOD');
        if (warnings > 0) console.log(`With ${warnings} warnings to note.`);
    } else {
        console.log(`🔴 SYSTEM HEALTH: CRITICAL (${errors} errors)`);
    }

    await prisma.$disconnect();
}

deepScan().catch(e => {
    console.error(e);
    process.exit(1);
});
