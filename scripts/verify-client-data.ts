import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    // Znajdź product
    const product = await prisma.product.findFirst({
        where: { sku: '113S3_ocieplane_42' }
    });

    if (!product) {
        console.log('Product not found!');
        return;
    }

    console.log('=== Product Info ===');
    console.log('ID:', product.id);
    console.log('SKU:', product.sku);
    console.log('Name:', product.name);

    // Sprzedaż 1 listopad 2025 - TERAZ (13 stycznia 2026)
    const sales = await prisma.sale.findMany({
        where: {
            productId: product.id,
            branchId: 100002, // NET
            date: {
                gte: new Date('2025-11-01'),
                lte: new Date() // Up to NOW
            }
        },
        orderBy: { date: 'asc' }
    });

    const totalQty = sales.reduce((sum, s) => sum + s.quantity, 0);
    const start = new Date('2025-11-01');
    const now = new Date();
    const days = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    console.log('\n=== Sales 1 Nov 2025 - NOW (Jan 13) (NET) ===');
    console.log('Range:', start.toISOString(), 'to', now.toISOString());
    console.log('Total transactions:', sales.length);
    console.log('Total quantity:', totalQty);
    console.log('Days in period:', days);

    // Stock
    const stock = await prisma.stock.findFirst({
        where: {
            productId: product.id,
            branchId: 100002 // NET
        }
    });

    console.log('\n=== Stock for NET ===');
    console.log('Quantity:', stock?.quantity || 0);
    console.log('Reserved:', stock?.reserved || 0);
    console.log('Available:', (stock?.quantity || 0) - (stock?.reserved || 0));

    // Check last few sales
    console.log('\n=== Last 5 Sales ===');
    sales.slice(-5).forEach(s => {
        console.log(`${s.date.toISOString()} - ${s.quantity} units`);
    });

    console.log('\n=== COMPARISON ===');
    console.log('Subiekt (client says): 116 pairs sold');
    console.log('PostgreSQL (our DB):', totalQty, 'pairs sold');
    console.log('Difference:', totalQty - 116);

    await prisma.$disconnect();
}

check().catch(console.error);
