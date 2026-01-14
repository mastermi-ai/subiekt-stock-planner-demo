import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function investigate() {
    console.log('🔍 INVESTIGATING 142 vs 116 DISCREPANCY...\n');

    // 1. Find the correct branch ID for "NET"
    const branches = await prisma.branch.findMany();
    console.log('Available branches:');
    branches.forEach(b => console.log(`  ${b.id} - ${b.symbol} (${b.name})`));

    const netBranch = branches.find(b => b.symbol === 'NET');
    if (!netBranch) {
        console.error('❌ NET branch not found!');
        await prisma.$disconnect();
        return;
    }

    console.log(`\n✅ NET branch ID: ${netBranch.id}`);

    // 2. Find product ID for 113S3_ocieplane_42
    const product = await prisma.product.findFirst({
        where: { sku: '113S3_ocieplane_42' }
    });

    if (!product) {
        console.error('❌ Product not found!');
        await prisma.$disconnect();
        return;
    }

    console.log(`✅ Product ID: ${product.id}\n`);

    // 3. Query sales for exact date range
    const sales = await prisma.sale.findMany({
        where: {
            productId: product.id,
            branchId: netBranch.id,
            date: {
                gte: new Date('2025-11-01T00:00:00.000Z'),
                lte: new Date('2026-01-09T23:59:59.999Z')
            }
        },
        orderBy: { date: 'asc' }
    });

    console.log(`📊 RESULTS FOR ${product.sku} in ${netBranch.symbol}:`);
    console.log(`   Date Range: 2025-11-01 to 2026-01-09`);
    console.log(`   Total Sales Records: ${sales.length}`);
    console.log(`   Total Quantity: ${sales.reduce((sum, s) => sum + s.quantity, 0)}`);

    if (sales.length > 0) {
        console.log(`   First Sale: ${sales[0].date.toISOString().split('T')[0]}`);
        console.log(`   Last Sale: ${sales[sales.length - 1].date.toISOString().split('T')[0]}`);
    }

    // 4. Check for duplicates
    const docIds = sales.map(s => s.documentId);
    const uniqueDocIds = new Set(docIds);
    console.log(`\n🔐 DUPLICATE CHECK:`);
    console.log(`   Total records: ${docIds.length}`);
    console.log(`   Unique documentIds: ${uniqueDocIds.size}`);

    if (docIds.length !== uniqueDocIds.size) {
        console.error('   ❌ DUPLICATES DETECTED!');
        const duplicates = docIds.filter((id, index) => docIds.indexOf(id) !== index);
        console.error(`   Duplicate IDs: ${[...new Set(duplicates)].join(', ')}`);
    } else {
        console.log('   ✅ No duplicates');
    }

    // 5. Group by date to see distribution
    const byDate = new Map<string, number>();
    sales.forEach(s => {
        const dateKey = s.date.toISOString().split('T')[0];
        byDate.set(dateKey, (byDate.get(dateKey) || 0) + s.quantity);
    });

    console.log(`\n📅 SALES BY DATE:`);
    Array.from(byDate.entries())
        .sort()
        .forEach(([date, qty]) => console.log(`   ${date}: ${qty} units`));

    await prisma.$disconnect();
}

investigate().catch(e => {
    console.error(e);
    process.exit(1);
});
