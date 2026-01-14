import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDocTypes() {
    // Product
    const product = await prisma.product.findFirst({
        where: { sku: '113S3_ocieplane_42' }
    });

    if (!product) return;

    // Sales 1 Nov - 9 Jan
    const sales = await prisma.sale.findMany({
        where: {
            productId: product.id,
            branchId: 100002, // NET
            date: {
                gte: new Date('2025-11-01'),
                lte: new Date('2026-01-09T23:59:59')
            }
        }
    });

    console.log('=== Sales Types (Nov 1 - Jan 9) ===');
    const byType = sales.reduce((acc, sale) => {
        const type = (sale as any).documentType || 'UNKNOWN'; // documentType might not be in mock types if not updated, but it is in schema
        if (!acc[type]) acc[type] = { count: 0, qty: 0 };
        acc[type].count++;
        acc[type].qty += sale.quantity;
        return acc;
    }, {} as Record<string, { count: number; qty: number }>);

    Object.entries(byType).forEach(([type, data]) => {
        console.log(`${type}: ${data.count} docs, ${data.qty} units`);
    });

    console.log('\nTotal: ' + sales.reduce((s, x) => s + x.quantity, 0));

    await prisma.$disconnect();
}

checkDocTypes().catch(console.error);
