import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAuth, validatePayload } from '@/lib/ingest-helpers';

export const dynamic = 'force-dynamic';

interface SaleData {
    productId: number;
    documentId: number;
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

                // Check if sale already exists
                const existing = await prisma.sale.findFirst({
                    where: {
                        productId: sale.productId,
                        branchId: sale.branchId,
                        date: saleDate,
                        documentId: sale.documentId,
                    },
                });

                if (existing) {
                    // Update existing
                    await prisma.sale.update({
                        where: { id: existing.id },
                        data: { quantity: sale.quantity },
                    });
                } else {
                    // Create new
                    await prisma.sale.create({
                        data: {
                            productId: sale.productId,
                            documentId: sale.documentId,
                            branchId: sale.branchId,
                            date: saleDate,
                            quantity: sale.quantity,
                        },
                    });
                }
                successCount++;
            } catch (err) {
                console.error(`[${syncRunId}] Failed to create sale:`, err);
            }
        }

        console.log(`[${syncRunId}] Synced ${successCount}/${data.length} sales`);

        return NextResponse.json({ success: true, count: successCount });
    } catch (error) {
        console.error(`[${syncRunId}] Sales sync error:`, error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}
