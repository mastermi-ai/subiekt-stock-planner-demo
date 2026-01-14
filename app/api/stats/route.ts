import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/stats
 * Returns summary statistics about synchronized data
 */
export async function GET() {
    try {
        const [productCount, stockCount, salesCount, supplierCount, branchCount] = await Promise.all([
            prisma.product.count(),
            prisma.stock.count(),
            prisma.sale.count(),
            prisma.supplier.count(),
            prisma.branch.count(),
        ]);

        // Get latest sale date
        const latestSale = await prisma.sale.findFirst({
            orderBy: { date: 'desc' },
            select: { date: true },
        });

        // Get oldest sale date
        const oldestSale = await prisma.sale.findFirst({
            orderBy: { date: 'asc' },
            select: { date: true },
        });

        return NextResponse.json({
            products: productCount,
            stocks: stockCount,
            sales: salesCount,
            suppliers: supplierCount,
            branches: branchCount,
            salesDateRange: {
                oldest: oldestSale?.date || null,
                latest: latestSale?.date || null,
            },
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch statistics' },
            { status: 500 }
        );
    }
}
