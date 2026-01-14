import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function removeDuplicates() {
    console.log('🧹 REMOVING DUPLICATE SALES...\n');

    try {
        // Find all duplicates
        const duplicates = await prisma.$queryRaw<Array<{
            productid: number;
            branchid: number;
            date: Date;
            documentid: number;
            cnt: bigint;
        }>>`
      SELECT "productId", "branchId", date, "documentId", COUNT(*) as cnt
      FROM "Sale"
      WHERE "documentId" != 0
      GROUP BY "productId", "branchId", date, "documentId"
      HAVING COUNT(*) > 1
    `;

        console.log(`Found ${duplicates.length} groups of duplicates\n`);

        if (duplicates.length === 0) {
            console.log('✅ No duplicates found!');
            await prisma.$disconnect();
            return;
        }

        let totalRemoved = 0;

        for (const dup of duplicates) {
            // Find all sales with this combination
            const sales = await prisma.sale.findMany({
                where: {
                    productId: dup.productid,
                    branchId: dup.branchid,
                    date: dup.date,
                    documentId: dup.documentid
                },
                orderBy: { id: 'asc' }
            });

            // Keep the first one, delete the rest
            const toDelete = sales.slice(1);

            if (toDelete.length > 0) {
                await prisma.sale.deleteMany({
                    where: {
                        id: { in: toDelete.map(s => s.id) }
                    }
                });

                totalRemoved += toDelete.length;

                if (totalRemoved % 100 === 0) {
                    console.log(`  Removed ${totalRemoved} duplicates so far...`);
                }
            }
        }

        console.log(`\n✅ Removed ${totalRemoved} duplicate sales`);
        console.log('Database is now ready for unique constraint');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

removeDuplicates();
