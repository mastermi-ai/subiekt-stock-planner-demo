import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const suppliers = await prisma.supplier.findMany({
            orderBy: { name: 'asc' }
        });

        // Convert to frontend format (ID as string)
        const mapped = suppliers.map((s) => ({
            ...s,
            id: s.id.toString()
        }));

        return NextResponse.json(mapped);
    } catch (error) {
        console.error('Failed to fetch suppliers:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
