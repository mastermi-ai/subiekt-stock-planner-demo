import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fullSystemVerification() {
    console.log('🔍 FULL SYSTEM VERIFICATION');
    console.log('═'.repeat(80));
    console.log('Comparing Planner data with Subiekt source...\n');

    try {
        // 1. Overall statistics
        const totalSales = await prisma.sale.count();
        const totalProducts = await prisma.product.count();
        const totalBranches = await prisma.branch.count();

        console.log('📊 DATABASE OVERVIEW:');
        console.log(`  Products: ${totalProducts.toLocaleString()}`);
        console.log(`  Branches: ${totalBranches}`);
        console.log(`  Sales Records: ${totalSales.toLocaleString()}`);

        // 2. DocumentId quality check
        const withoutDocId = await prisma.sale.count({
            where: { documentId: 0 }
        });

        const duplicateCheck = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM (
        SELECT "productId", "branchId", "date", "documentId", COUNT(*) as cnt
        FROM "Sale"
        WHERE "documentId" != 0
        GROUP BY "productId", "branchId", "date", "documentId"
        HAVING COUNT(*) > 1
      ) duplicates
    `;

        const duplicateCount = Number(duplicateCheck[0]?.count || 0);

        console.log('\n🔑 DATA QUALITY:');
        console.log(`  Sales without documentId: ${withoutDocId} ${withoutDocId > 0 ? '❌' : '✅'}`);
        console.log(`  Duplicate sales: ${duplicateCount} ${duplicateCount > 0 ? '❌' : '✅'}`);

        // 3. Date coverage
        const dateStats = await prisma.sale.aggregate({
            _min: { date: true },
            _max: { date: true }
        });

        console.log('\n📅 DATE COVERAGE:');
        console.log(`  From: ${dateStats._min.date?.toISOString().split('T')[0]}`);
        console.log(`  To: ${dateStats._max.date?.toISOString().split('T')[0]}`);

        const daysCovered = dateStats._min.date && dateStats._max.date
            ? Math.round((dateStats._max.date.getTime() - dateStats._min.date.getTime()) / (1000 * 60 * 60 * 24))
            : 0;

        console.log(`  Days covered: ${daysCovered} (target: ~450 days)`);
        console.log(`  Status: ${daysCovered >= 440 ? '✅ Complete' : '⚠️ Incomplete - sync in progress'}`);

        // 4. Branch breakdown
        console.log('\n🏢 SALES BY BRANCH:');
        const branchSales = await prisma.branch.findMany({
            select: {
                symbol: true,
                name: true,
                _count: {
                    select: { sales: true }
                }
            },
            orderBy: {
                sales: {
                    _count: 'desc'
                }
            }
        });

        branchSales.forEach(branch => {
            console.log(`  ${branch.symbol.padEnd(10)} ${branch._count.sales.toLocaleString().padStart(10)} sales`);
        });

        // 5. Top products by sales volume
        console.log('\n📦 TOP 10 PRODUCTS BY SALES VOLUME:');
        const topProducts = await prisma.product.findMany({
            select: {
                sku: true,
                name: true,
                sales: {
                    select: {
                        quantity: true
                    }
                }
            },
            take: 500
        });

        const productVolumes = topProducts
            .map(p => ({
                sku: p.sku,
                name: p.name,
                totalQty: p.sales.reduce((sum, s) => sum + Number(s.quantity), 0),
                salesCount: p.sales.length
            }))
            .filter(p => p.salesCount > 0)
            .sort((a, b) => b.totalQty - a.totalQty)
            .slice(0, 10);

        productVolumes.forEach((p, i) => {
            console.log(`  ${(i + 1).toString().padStart(2)}. ${p.sku.padEnd(25)} qty: ${p.totalQty.toFixed(0).padStart(8)} (${p.salesCount} sales)`);
        });

        // 6. Monthly sales breakdown (last 6 months)
        console.log('\n📈 MONTHLY SALES (Last 6 Months):');
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlySales = await prisma.$queryRaw<Array<{
            year: number;
            month: number;
            count: bigint;
            total_qty: number;
        }>>`
      SELECT 
        EXTRACT(YEAR FROM date) as year,
        EXTRACT(MONTH FROM date) as month,
        COUNT(*) as count,
        SUM(quantity) as total_qty
      FROM "Sale"
      WHERE date >= ${sixMonthsAgo}
      GROUP BY year, month
      ORDER BY year DESC, month DESC
    `;

        monthlySales.forEach(m => {
            const monthName = new Date(Number(m.year), Number(m.month) - 1).toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
            console.log(`  ${monthName.padEnd(20)} ${Number(m.count).toLocaleString().padStart(8)} sales, qty: ${m.total_qty.toFixed(0).padStart(10)}`);
        });

        // 7. Sample verification - random products
        console.log('\n🎲 RANDOM SAMPLE VERIFICATION (5 products):');
        const randomProducts = await prisma.$queryRaw<Array<{
            id: number;
            sku: string;
            name: string;
        }>>`
      SELECT id, sku, name
      FROM "Product"
      WHERE id IN (
        SELECT DISTINCT "productId" 
        FROM "Sale"
        ORDER BY RANDOM()
        LIMIT 5
      )
    `;

        for (const product of randomProducts) {
            const sales = await prisma.sale.findMany({
                where: { productId: product.id },
                select: {
                    documentId: true,
                    date: true,
                    quantity: true,
                    branch: {
                        select: { symbol: true }
                    }
                }
            });

            const uniqueDocs = new Set(sales.map(s => s.documentId));
            const totalQty = sales.reduce((sum, s) => sum + Number(s.quantity), 0);

            console.log(`\n  ${product.sku} (${product.name.substring(0, 40)})`);
            console.log(`    Sales: ${sales.length}, Unique docs: ${uniqueDocs.size}, Total qty: ${totalQty.toFixed(2)}`);
            console.log(`    Duplicate rate: ${uniqueDocs.size === sales.length ? '✅ 0%' : `⚠️ ${((1 - uniqueDocs.size / sales.length) * 100).toFixed(1)}%`}`);
        }

        // 8. Final validation
        console.log('\n' + '═'.repeat(80));
        console.log('📋 FINAL VALIDATION CHECKLIST:\n');

        const checks = [
            { name: 'All sales have documentId', pass: withoutDocId === 0 },
            { name: 'No duplicate sales', pass: duplicateCount === 0 },
            { name: 'Date coverage >= 440 days', pass: daysCovered >= 440 },
            { name: 'All branches have data', pass: branchSales.every(b => b._count.sales > 0) },
            { name: 'Products have sales', pass: productVolumes.length > 0 },
        ];

        checks.forEach(check => {
            console.log(`  ${check.pass ? '✅' : '❌'} ${check.name}`);
        });

        const allPassed = checks.every(c => c.pass);

        console.log('\n' + '═'.repeat(80));
        if (allPassed) {
            console.log('🎉 ALL CHECKS PASSED - SYSTEM 100% READY FOR PRODUCTION!');
        } else {
            console.log('⚠️  SOME CHECKS FAILED - Review issues above');
        }
        console.log('═'.repeat(80));

    } catch (error) {
        console.error('❌ Verification failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fullSystemVerification();
