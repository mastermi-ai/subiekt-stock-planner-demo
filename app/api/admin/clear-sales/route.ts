import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
    try {
        await prisma.sale.deleteMany({});
        return NextResponse.json({ success: true, message: 'All sales deleted' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete sales' }, { status: 500 });
    }
}
