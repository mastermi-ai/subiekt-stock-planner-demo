import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debug() {
    const product = await prisma.product.findFirst({
        where: { sku: '113S3_ocieplane_42' }
    });

    if (!product) return;

    // Period: Nov 1 - Jan 9
    const sales = await prisma.sale.findMany({
        where: {
            productId: product.id,
            branchId: 100002,
            date: {
                gte: new Date('2025-11-01'),
                lte: new Date('2026-01-10T23:59:59') // Check Jan 10 too
            }
        },
        orderBy: { date: 'asc' }
    });

    console.log('=== SALES ANALYSIS (Nov 1 - Jan 9) ===');
    console.log('Total Count:', sales.length);
    console.log('Total Sum:', sales.reduce((a, b) => a + b.quantity, 0));

    // 1. Check for negative quantities (Returns)
    const returns = sales.filter(s => s.quantity < 0);
    console.log('\n--- Returns (Negative Quantity) ---');
    if (returns.length > 0) {
        console.log(`Found ${returns.length} returns:`);
        returns.forEach(r => console.log(`${r.date.toISOString()}: ${r.quantity}`));
        const returnSum = returns.reduce((a, b) => a + b.quantity, 0);
        console.log(`Total returns quantity: ${returnSum}`);
        console.log(`Count without returns (absolute sum?): maybe client ignores returns?`);
    } else {
        console.log('No negative quantities found.');
    }

    // 2. Check boundary dates
    console.log('\n--- Boundary Dates ---');
    const startSales = sales.filter(s => s.date.toISOString().startsWith('2025-11-01'));
    const endSales = sales.filter(s => s.date.toISOString().startsWith('2026-01-09'));

    console.log(`Sales on Nov 1: ${startSales.reduce((a, b) => a + b.quantity, 0)} units (${startSales.length} docs)`);
    startSales.forEach(s => console.log(`  ${s.date.toISOString()} - ${s.quantity}`));

    console.log(`Sales on Jan 9: ${endSales.reduce((a, b) => a + b.quantity, 0)} units (${endSales.length} docs)`);
    endSales.forEach(s => console.log(`  ${s.date.toISOString()} - ${s.quantity}`));

    // 3. Document Types breakdown again
    console.log('\n--- Document Types ---');
    // We need to cast to any because documentType might not be in the generated type definition yet if we didn't run generate
    // But it should be in the DB
    const types = sales.reduce((acc, sale) => {
        const t = (sale as any)['documentType'] || 'UNKNOWN';
        acc[t] = (acc[t] || 0) + sale.quantity;
        return acc;
    }, {} as Record<string, number>);
    console.log(JSON.stringify(types, null, 2));

    await prisma.$disconnect();
}

debug().catch(console.error);
