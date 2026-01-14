import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('\n=== Checking November-December 2025 Sales for SKU 113S3_ocieplane_42 ===\n');
    console.log('Period: 2025-11-01 to 2025-12-31 (matching TeamViewer session)\n');

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
      AND s.date >= '2025-11-01'::date
      AND s.date < '2026-01-01'::date
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

    console.log('\n=== COMPARISON WITH TEAMVIEWER SESSION ===');
    console.log('TeamViewer (2026-01-12): 116 pairs reported by client');
    console.log(`PostgreSQL (current):    ${totalUnits} pairs`);

    if (totalUnits === 116) {
        console.log('\n✅ PERFECT MATCH with client data!');
    } else {
        const ratio = (totalUnits / 116).toFixed(2);
        console.log(`\n⚠️ Difference: ${ratio}x (${totalUnits - 116} pairs ${totalUnits > 116 ? 'over' : 'under'})`);
    }

    console.log('\n=== AWAITING SSMS RESULTS ===');
    console.log('Run verification_ssms_nov_dec.sql in SSMS to get Subiekt source data');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
