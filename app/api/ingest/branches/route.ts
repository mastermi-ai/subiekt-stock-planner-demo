import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAuth, validatePayload } from '@/lib/ingest-helpers';

export const dynamic = 'force-dynamic';

interface BranchData {
    Id: number;
    Name: string;
    Symbol: string;
}

export async function POST(request: NextRequest) {
    const authError = validateAuth(request);
    if (authError) return authError;

    const payloadOrError = await validatePayload<BranchData>(request);
    if (payloadOrError instanceof NextResponse) return payloadOrError;

    const { clientId, syncRunId, data } = payloadOrError;

    try {
        const operations = data.map((branch) =>
            prisma.branch.upsert({
                where: { id: branch.Id },
                create: {
                    id: branch.Id,
                    name: branch.Name,
                    symbol: branch.Symbol,
                },
                update: {
                    name: branch.Name,
                    symbol: branch.Symbol,
                },
            })
        );

        await prisma.$transaction(operations);

        console.log(`[${syncRunId}] Synced ${data.length} branches for client ${clientId}`);

        return NextResponse.json({ success: true, count: data.length });
    } catch (error) {
        console.error(`[${syncRunId}] Branches sync error:`, error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}
