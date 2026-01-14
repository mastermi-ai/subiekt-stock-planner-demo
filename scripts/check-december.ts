import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('\n=== Checking December 2025 Sales for SKU 113S3_ocieplane_42 ===\n');

    // Query by branch
    const salesByBranch = await prisma.$queryRaw<Array<{
        BranchId: number;
        Oddział: string;
        'Liczba Dokumentów': bigint;
        'Suma Sztuk': number;
    }>>`
    SELECT 
      b.id as "BranchId",
      b.symbol as "Oddział",
      COUNT(*)::bigint as "Liczba Dokumentów",
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

    console.log('PostgreSQL Results:');
    console.table(salesByBranch.map(row => ({
        BranchId: row.BranchId,
        Oddział: row['Oddział'],
        'Liczba Dokumentów': Number(row['Liczba Dokumentów']),
        'Suma Sztuk': row['Suma Sztuk']
    })));

    const totalDocs = salesByBranch.reduce((sum, row) => sum + Number(row['Liczba Dokumentów']), 0);
    const totalUnits = salesByBranch.reduce((sum, row) => sum + row['Suma Sztuk'], 0);

    console.log('\n=== PostgreSQL TOTAL ===');
    console.log(`Documents: ${totalDocs}`);
    console.log(`Units: ${totalUnits}`);

    console.log('\n=== COMPARISON ===');
    console.log('Subiekt (SSMS):    33 documents, 35 units');
    console.log(`PostgreSQL (Our):  ${totalDocs} documents, ${totalUnits} units`);
    console.log(`Difference:        ${totalDocs - 33} documents, ${totalUnits - 35} units`);

    if (totalDocs === 33 && totalUnits === 35) {
        console.log('\n✅ PERFECT MATCH! Data is 100% accurate!');
    } else {
        console.log(`\n⚠️ DISCREPANCY FOUND: ${((totalUnits / 35) * 100).toFixed(1)}% of expected`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
