import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAuth, validatePayload } from '@/lib/ingest-helpers';

export const dynamic = 'force-dynamic';

interface StockData {
    productId: number;
    branchId: number;
    currentStock: number;
    reservedStock: number;
}

// Track which sync runs have already had their first batch processed
// This prevents deleting all stocks on every batch
const processedSyncRuns = new Set<string>();

export async function POST(request: NextRequest) {
    const authError = validateAuth(request);
    if (authError) return authError;

    const payloadOrError = await validatePayload<StockData>(request);
    if (payloadOrError instanceof NextResponse) return payloadOrError;

    const { clientId, syncRunId, data } = payloadOrError;

    const isFirstBatch = !processedSyncRuns.has(syncRunId);

    console.log(`[${syncRunId}] ${isFirstBatch ? 'FIRST' : 'SUBSEQUENT'} BATCH - Received ${data.length} stocks`);
    if (data.length > 0) {
        console.log(`[${syncRunId}] Sample stock:`, JSON.stringify(data[0], null, 2));
    }

    try {
        if (isFirstBatch) {
            // Only delete all stocks on the FIRST batch of a new sync run
            console.log(`[${syncRunId}] First batch detected - Deleting all existing stocks`);
            await prisma.stock.deleteMany({});
            processedSyncRuns.add(syncRunId);
        }

        // Use upsert to safely handle duplicates and overlaps
        let processed = 0;
        let skipped = 0;
        for (const stock of data) {
            // Check if product exists first
            const productExists = await prisma.product.findUnique({
                where: { id: stock.productId },
                select: { id: true }
            });

            if (!productExists) {
                skipped++;
                continue; // Skip if product doesn't exist
            }

            await prisma.stock.upsert({
                where: {
                    productId_branchId: {
                        productId: stock.productId,
                        branchId: stock.branchId,
                    },
                },
                create: {
                    productId: stock.productId,
                    branchId: stock.branchId,
                    quantity: stock.currentStock,
                    reserved: stock.reservedStock,
                },
                update: {
                    quantity: stock.currentStock,
                    reserved: stock.reservedStock,
                },
            });
            processed++;

            // Log progress every 50 records
            if (processed % 50 === 0) {
                console.log(`[${syncRunId}] Processed ${processed}/${data.length} stocks`);
            }
        }

        if (skipped > 0) {
            console.log(`[${syncRunId}] Skipped ${skipped} stocks for non-existent products`);
        }
        console.log(`[${syncRunId}] Batch complete: ${processed} stocks processed`);

        return NextResponse.json({ success: true, count: processed, skipped });
    } catch (error) {
        console.error(`[${syncRunId}] Stocks sync error:`, error);
        // Remove from processed set on error so next attempt can retry from scratch
        processedSyncRuns.delete(syncRunId);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}
