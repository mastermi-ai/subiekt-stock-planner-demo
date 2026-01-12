import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAuth, validatePayload } from '@/lib/ingest-helpers';

export const dynamic = 'force-dynamic';

interface SaleData {
    productId: number;
    date: string; // ISO date string
    quantity: number;
    branchId: number;
}

export async function POST(request: NextRequest) {
    const authError = validateAuth(request);
    if (authError) return authError;

    const payloadOrError = await validatePayload<SaleData>(request);
    if (payloadOrError instanceof NextResponse) return payloadOrError;

    const { clientId, syncRunId, data } = payloadOrError;

    try {
        let successCount = 0;
        for (const sale of data) {
            try {
                const saleDate = new Date(sale.date);

                await prisma.sale.upsert({
                    where: {
                        sale_unique_key: {
                            productId: sale.productId,
                            branchId: sale.branchId,
                            date: saleDate,
                            quantity: sale.quantity,
                        },
                    },
                    create: {
                        productId: sale.productId,
                        branchId: sale.branchId,
                        date: saleDate,
                        quantity: sale.quantity,
                    },
                    update: {
                        quantity: sale.quantity, // Set instead of increment - this is re-sync
                    },
                });
                successCount++;
            } catch (err) {
                console.error(`[${syncRunId}] Failed to upsert sale:`, err);
            }
        }

        console.log(`[${syncRunId}] Synced ${successCount}/${data.length} sales`);

        return NextResponse.json({ success: true, count: successCount });
    } catch (error) {
        console.error(`[${syncRunId}] Sales sync error:`, error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}
