import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAuth, validatePayload } from '@/lib/ingest-helpers';

export const dynamic = 'force-dynamic';

interface SupplierData {
    id: number;
    name: string;
    nip?: string;
}

export async function POST(request: NextRequest) {
    // Auth
    const authError = validateAuth(request);
    if (authError) return authError;

    // Validate payload
    const payloadOrError = await validatePayload<SupplierData>(request);
    if (payloadOrError instanceof NextResponse) return payloadOrError;

    const { clientId, syncRunId, data } = payloadOrError;

    try {
        console.log(`[${syncRunId}] Processing ${data.length} suppliers for client ${clientId}`);

        // Log first item to debug
        if (data.length > 0) {
            console.log(`[${syncRunId}] Sample supplier:`, JSON.stringify(data[0]));
        }

        // Process suppliers sequentially (avoid transaction timeout on large batches)
        let successCount = 0;
        for (const supplier of data) {
            try {
                await prisma.supplier.upsert({
                    where: { id: supplier.id },
                    create: {
                        id: supplier.id,
                        name: supplier.name,
                        nip: supplier.nip || null,
                    },
                    update: {
                        name: supplier.name,
                        nip: supplier.nip || null,
                    },
                });
                successCount++;
            } catch (err) {
                console.error(`[${syncRunId}] Failed to upsert supplier ${supplier.id}:`, err);
                // Continue processing others
            }
        }

        console.log(`[${syncRunId}] Synced ${successCount}/${data.length} suppliers successfully`);

        return NextResponse.json({
            success: true,
            count: successCount
        });
    } catch (error) {
        console.error(`[${syncRunId}] Suppliers sync error:`, error);
        return NextResponse.json(
            { error: 'Database error' },
            { status: 500 }
        );
    }
}
