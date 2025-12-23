import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const products = await prisma.product.findMany({
            include: { stocks: true }
        });

        const mapped = products.map(p => {
            const stockByBranch: Record<string, number> = {};
            p.stocks.forEach(s => {
                stockByBranch[s.branchId.toString()] = s.quantity;
            });

            return {
                id: p.id.toString(),
                sku: p.sku,
                name: p.name,
                supplierId: p.supplierId ? p.supplierId.toString() : '',
                stockByBranch
            };
        });

        return NextResponse.json(mapped);
    } catch (error) {
        console.error('Failed to fetch products:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
