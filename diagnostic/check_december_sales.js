const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: 'postgresql://subiekt_planning_user:5PjLw9H1DQQFXWUOOmGr3FvVA43pT419@dpg-ct6p5haj1k6c73d4kjdg-a.frankfurt-postgres.render.com/subiekt_planning'
        }
    }
});

async function checkDecemberSales() {
    try {
        const results = await prisma.$queryRaw`
      SELECT 
        b.id as "BranchId",
        b.symbol as "Oddział",
        COUNT(*)::int as "Liczba Dokumentów",
        SUM(s.quantity)::float as "Suma Sztuk"
      FROM "Sale" s
      JOIN "Product" p ON s."productId" = p.id
      JOIN "Branch" b ON s."branchId" = b.id
      WHERE p.sku = '113S3_ocieplane_42'
        AND s.date >= '2025-12-01'::date
        AND s.date < '2025-12-31'::date
      GROUP BY b.id, b.symbol
      ORDER BY "Suma Sztuk" DESC
    `;

        console.log('\n=== PostgreSQL Results (December 2025, SKU 113S3_ocieplane_42) ===\n');
        console.table(results);

        const total = results.reduce((acc, row) => ({
            docs: acc.docs + row['Liczba Dokumentów'],
            units: acc.units + row['Suma Sztuk']
        }), { docs: 0, units: 0 });

        console.log('\n=== TOTAL ===');
        console.log(`Documents: ${total.docs}`);
        console.log(`Units: ${total.units}`);

        console.log('\n=== Comparison with Subiekt (SSMS) ===');
        console.log('Subiekt: 33 documents, 35 units');
        console.log(`PostgreSQL: ${total.docs} documents, ${total.units} units`);
        console.log(`Difference: ${total.docs - 33} documents, ${total.units - 35} units`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkDecemberSales();
