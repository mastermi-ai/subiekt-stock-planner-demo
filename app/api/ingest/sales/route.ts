import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAuth, validatePayload } from '@/lib/ingest-helpers';

export const dynamic = 'force-dynamic';

interface SaleData {
    ProductId: number;
    Date: string; // ISO date string
    Quantity: number;
    BranchId: number;
}

export async function POST(request: NextRequest) {
    const authError = validateAuth(request);
    if (authError) return authError;

    const payloadOrError = await validatePayload<SaleData>(request);
    if (payloadOrError instanceof NextResponse) return payloadOrError;

    const { clientId, syncRunId, data } = payloadOrError;

    try {
        // Upsert sales with deduplication by productId + branchId + date
        // Aggregate quantities for duplicates
        const operations = data.map((sale) => {
            const saleDate = new Date(sale.Date);

            return prisma.sale.upsert({
                where: {
                    productId_branchId_date: {
                        productId: sale.ProductId,
                        branchId: sale.BranchId,
                        date: saleDate,
                    },
                },
                create: {
                    productId: sale.ProductId,
                    branchId: sale.BranchId,
                    date: saleDate,
                    quantity: sale.Quantity,
                },
                update: {
                    // On conflict, add quantities (handle potential duplicates in source)
                    quantity: {
                        increment: sale.Quantity,
                    },
                },
            });
        });

        await prisma.$transaction(operations);

        console.log(`[${syncRunId}] Synced ${data.length} sales for client ${clientId}`);

        return NextResponse.json({ success: true, count: data.length });
    } catch (error) {
        console.error(`[${syncRunId}] Sales sync error:`, error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}
