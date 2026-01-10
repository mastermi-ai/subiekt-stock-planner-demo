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
        let successCount = 0;
        for (const product of data) {
            try {
                await prisma.product.upsert({
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
                });
                successCount++;
            } catch (err) {
                console.error(`[${syncRunId}] Failed to upsert product ${product.Id}:`, err);
            }
        }

        console.log(`[${syncRunId}] Synced ${successCount}/${data.length} products`);

        return NextResponse.json({ success: true, count: successCount });
    } catch (error) {
        console.error(`[${syncRunId}] Products sync error:`, error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}
