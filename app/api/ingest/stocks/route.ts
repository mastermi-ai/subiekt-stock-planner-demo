import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAuth, validatePayload } from '@/lib/ingest-helpers';

export const dynamic = 'force-dynamic';

interface StockData {
    ProductId: number;
    BranchId: number;
    CurrentStock: number;
    ReservedStock: number;
}

export async function POST(request: NextRequest) {
    const authError = validateAuth(request);
    if (authError) return authError;

    const payloadOrError = await validatePayload<StockData>(request);
    if (payloadOrError instanceof NextResponse) return payloadOrError;

    const { clientId, syncRunId, data } = payloadOrError;

    try {
        // CRITICAL: Stocks are a full snapshot - delete all first
        await prisma.stock.deleteMany({});
        console.log(`[${syncRunId}] Deleted all existing stocks`);

        // Insert new stocks in batches to avoid memory issues
        const batchSize = 1000;
        let inserted = 0;

        for (let i = 0; i < data.length; i += batchSize) {
            const batch = data.slice(i, i + batchSize);
            await prisma.stock.createMany({
                data: batch.map((stock) => ({
                    productId: stock.ProductId,
                    branchId: stock.BranchId,
                    quantity: stock.CurrentStock,
                    reserved: stock.ReservedStock,
                })),
                skipDuplicates: true,
            });
            inserted += batch.length;
            console.log(`[${syncRunId}] Inserted ${inserted}/${data.length} stocks`);
        }

        console.log(`[${syncRunId}] Stock sync complete: ${inserted} entries`);

        return NextResponse.json({ success: true, count: inserted });
    } catch (error) {
        console.error(`[${syncRunId}] Stocks sync error:`, error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}
