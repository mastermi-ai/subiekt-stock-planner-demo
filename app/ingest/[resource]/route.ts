import { NextResponse } from 'next/server';

export async function POST(request: Request, { params }: { params: Promise<{ resource: string }> }) {
    const { resource } = await params;

    try {
        const body = await request.json();
        const count = Array.isArray(body) ? body.length : 1;

        console.log(`[INGEST] Received ${count} items for resource: ${resource}`);

        // TODO: Here you would save data to database (Postgres/Prisma)
        // For now, we mock success to satisfy the connector

        return NextResponse.json({
            success: true,
            resource,
            received: count
        });
    } catch (error) {
        console.error('Ingest error:', error);
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
}
