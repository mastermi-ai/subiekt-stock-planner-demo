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
        let successCount = 0;
        for (const branch of data) {
            try {
                await prisma.branch.upsert({
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
                });
                successCount++;
            } catch (err) {
                console.error(`[${syncRunId}] Failed to upsert branch ${branch.Id}:`, err);
            }
        }

        console.log(`[${syncRunId}] Synced ${successCount}/${data.length} branches for client ${clientId}`);

        return NextResponse.json({ success: true, count: successCount });
    } catch (error) {
        console.error(`[${syncRunId}] Branches sync error:`, error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}
