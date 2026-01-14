import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkConnectorHealth() {
    console.log('\n=== Connector Health Check ===\n');

    try {
        // Check latest sale sync
        const latestSale = await prisma.sale.findFirst({
            orderBy: { id: 'desc' },
            include: {
                product: { select: { sku: true, name: true } },
                branch: { select: { symbol: true } }
            }
        });

        if (latestSale) {
            console.log('✅ Latest Sale Record:');
            console.log(`   Product: ${latestSale.product.sku} (${latestSale.product.name})`);
            console.log(`   Branch: ${latestSale.branch.symbol}`);
            console.log(`   Date: ${latestSale.date.toISOString().split('T')[0]}`);
            console.log(`   Quantity: ${latestSale.quantity}`);
            console.log(`   Record ID: ${latestSale.id}`);
        }

        // Check data freshness
        const recentSales = await prisma.sale.count({
            where: {
                date: {
                    gte: new Date('2026-01-01')
                }
            }
        });

        console.log(`\n📊 Sales in January 2026: ${recentSales}`);

        // Check total counts
        const totalProducts = await prisma.product.count();
        const totalBranches = await prisma.branch.count();
        const totalSuppliers = await prisma.supplier.count();
        const totalSales = await prisma.sale.count();
        const totalStocks = await prisma.stock.count();

        console.log('\n📈 Database Statistics:');
        console.log(`   Products: ${totalProducts}`);
        console.log(`   Branches: ${totalBranches}`);
        console.log(`   Suppliers: ${totalSuppliers}`);
        console.log(`   Sales: ${totalSales}`);
        console.log(`   Stocks: ${totalStocks}`);

        // Check for today's data (would indicate connector is running)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todaysSales = await prisma.sale.count({
            where: { date: { gte: today } }
        });

        if (todaysSales > 0) {
            console.log(`\n✅ Connector appears ACTIVE: ${todaysSales} sales from today`);
        } else {
            console.log('\n⚠️ No sales from today - connector may be idle or client has no sales yet');
        }

    } catch (error) {
        console.error('❌ Error checking connector health:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkConnectorHealth();
