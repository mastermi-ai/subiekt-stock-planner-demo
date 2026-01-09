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
        // CRITICAL: Stocks are a full snapshot, not incremental
        // Delete all existing stocks before inserting fresh data
        await prisma.stock.deleteMany({});

        // Insert new stocks
        await prisma.stock.createMany({
            data: data.map((stock) => ({
                productId: stock.ProductId,
                branchId: stock.BranchId,
                quantity: stock.CurrentStock,
                reserved: stock.ReservedStock,
            })),
        });

        console.log(`[${syncRunId}] Replaced all stocks with ${data.length} entries for client ${clientId}`);

        return NextResponse.json({ success: true, count: data.length });
    } catch (error) {
        console.error(`[${syncRunId}] Stocks sync error:`, error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}
