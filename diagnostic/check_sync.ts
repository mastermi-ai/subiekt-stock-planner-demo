
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- VERIFICATION START ---');

    const totalSuppliers = await prisma.supplier.count();
    console.log(`Current Suppliers in DB: ${totalSuppliers}`);

    const totalBranches = await prisma.branch.count();
    console.log(`Branches: ${totalBranches}`);
    const branches = await prisma.branch.findMany({ select: { name: true } });
    console.log('Branch Names:', branches.map(b => b.name));

    const totalStocks = await prisma.stock.count();
    console.log(`Stocks: ${totalStocks}`);

    const totalProducts = await prisma.product.count();
    console.log(`Total Products: ${totalProducts}`);

    const productsWithSupplier = await prisma.product.count({
        where: { supplierId: { not: null } }
    });
    console.log(`Products with Supplier ID: ${productsWithSupplier}`);

    if (productsWithSupplier > 0) {
        console.log(`Success! ${((productsWithSupplier / totalProducts) * 100).toFixed(1)}% of products have a supplier.`);
        const sample = await prisma.product.findFirst({
            where: { supplierId: { not: null } },
            include: { supplier: true }
        });

        if (sample) {
            console.log('Sample linked product:', {
                id: sample.id,
                name: sample.name,
                supplier: sample.supplier ? sample.supplier.name : 'Unknown'
            });
        }
    } else {
        console.log('WARNING: Still no products with suppliers linked.');
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
