import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAuth, validatePayload } from '@/lib/ingest-helpers';

export const dynamic = 'force-dynamic';

interface ProductData {
    id: number;
    sku: string;
    name: string;
    supplierId?: number;
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
                    where: { id: product.id },
                    create: {
                        id: product.id,
                        sku: product.sku,
                        name: product.name,
                        supplierId: product.supplierId || null,
                    },
                    update: {
                        sku: product.sku,
                        name: product.name,
                        supplierId: product.supplierId || null,
                    },
                });
                successCount++;
            } catch (err) {
                console.error(`[${syncRunId}] Failed to upsert product ${product.id}:`, err);
            }
        }

        console.log(`[${syncRunId}] Synced ${successCount}/${data.length} products`);

        return NextResponse.json({ success: true, count: successCount });
    } catch (error) {
        console.error(`[${syncRunId}] Products sync error:`, error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}
