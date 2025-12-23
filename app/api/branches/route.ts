import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Branch } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const branches = await prisma.branch.findMany({
            orderBy: { id: 'asc' }
        });

        const mapped = branches.map((b: Branch) => ({
            ...b,
            id: b.id.toString()
        }));

        return NextResponse.json(mapped);
    } catch (error) {
        console.error('Failed to fetch branches:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
