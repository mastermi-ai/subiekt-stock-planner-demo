import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDetails() {
    const product = await prisma.product.findFirst({
        where: { sku: '113S3_ocieplane_42' }
    });

    if (!product) return;

    // Get all sales with details
    const sales = await prisma.sale.findMany({
        where: {
            productId: product.id,
            branchId: 100002, // NET
            date: {
                gte: new Date('2025-11-01'),
                lte: new Date('2026-01-09T23:59:59')
            }
        },
        orderBy: { date: 'asc' }
    });

    console.log('=== DETAILED SALES BREAKDOWN ===');
    console.log('Total records:', sales.length);
    console.log('Total quantity:', sales.reduce((s, r) => s + r.quantity, 0));

    // Group by date
    const byDate = sales.reduce((acc, sale) => {
        const dateStr = sale.date.toISOString().split('T')[0];
        if (!acc[dateStr]) acc[dateStr] = { count: 0, qty: 0 };
        acc[dateStr].count++;
        acc[dateStr].qty += sale.quantity;
        return acc;
    }, {} as Record<string, { count: number; qty: number }>);

    console.log('\n=== Sales by Date ===');
    Object.entries(byDate).forEach(([date, data]) => {
        console.log(`${date}: ${data.count} transactions, ${data.qty} units`);
    });

    // Check for duplicates
    const duplicates = sales.filter((sale, index, arr) =>
        arr.findIndex(s =>
            s.date.getTime() === sale.date.getTime() &&
            s.quantity === sale.quantity &&
            s.id !== sale.id
        ) !== index
    );

    console.log('\n=== Potential Duplicates ===');
    console.log('Found:', duplicates.length, 'duplicate records');

    if (duplicates.length > 0) {
        console.log('Sample duplicates:');
        duplicates.slice(0, 5).forEach(dup => {
            console.log(`  ID ${dup.id}: ${dup.date.toISOString()} - ${dup.quantity} units`);
        });
    }

    await prisma.$disconnect();
}

checkDetails().catch(console.error);
