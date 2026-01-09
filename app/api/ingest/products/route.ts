import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAuth, validatePayload } from '@/lib/ingest-helpers';

export const dynamic = 'force-dynamic';

interface ProductData {
    Id: number;
    Sku: string;
    Name: string;
    SupplierId?: number;
}

export async function POST(request: NextRequest) {
    const authError = validateAuth(request);
    if (authError) return authError;

    const payloadOrError = await validatePayload<ProductData>(request);
    if (payloadOrError instanceof NextResponse) return payloadOrError;

    const { clientId, syncRunId, data } = payloadOrError;

    try {
        const operations = data.map((product) =>
            prisma.product.upsert({
                where: { id: product.Id },
                create: {
                    id: product.Id,
                    sku: product.Sku,
                    name: product.Name,
                    supplierId: product.SupplierId || null,
                },
                update: {
                    sku: product.Sku,
                    name: product.Name,
                    supplierId: product.SupplierId || null,
                },
            })
        );

        await prisma.$transaction(operations);

        console.log(`[${syncRunId}] Synced ${data.length} products for client ${clientId}`);

        return NextResponse.json({ success: true, count: data.length });
    } catch (error) {
        console.error(`[${syncRunId}] Products sync error:`, error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}
