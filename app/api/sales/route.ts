import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const days = parseInt(searchParams.get('days') || '90');

        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - days);

        const sales = await prisma.sale.findMany({
            where: {
                date: { gte: fromDate }
            },
            orderBy: { date: 'desc' }
        });

        const mapped = sales.map((s) => ({
            id: s.id.toString(),
            productId: s.productId.toString(),
            branchId: s.branchId.toString(),
            date: s.date.toISOString().split('T')[0],
            quantity: s.quantity
        }));

        return NextResponse.json(mapped);
    } catch (error) {
        console.error('Failed to fetch sales:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        await prisma.sale.deleteMany({});
        return NextResponse.json({ success: true, message: 'All sales deleted' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete sales' }, { status: 500 });
    }
}
