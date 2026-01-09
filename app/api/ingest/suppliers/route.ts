import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAuth, validatePayload } from '@/lib/ingest-helpers';

export const dynamic = 'force-dynamic';

interface SupplierData {
    Id: number;
    Name: string;
    Nip?: string;
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
        // Upsert suppliers
        const operations = data.map((supplier) =>
            prisma.supplier.upsert({
                where: { id: supplier.Id },
                create: {
                    id: supplier.Id,
                    name: supplier.Name,
                    nip: supplier.Nip || null,
                },
                update: {
                    name: supplier.Name,
                    nip: supplier.Nip || null,
                },
            })
        );

        await prisma.$transaction(operations);

        console.log(`[${syncRunId}] Synced ${data.length} suppliers for client ${clientId}`);

        return NextResponse.json({
            success: true,
            count: data.length
        });
    } catch (error) {
        console.error(`[${syncRunId}] Suppliers sync error:`, error);
        return NextResponse.json(
            { error: 'Database error' },
            { status: 500 }
        );
    }
}
