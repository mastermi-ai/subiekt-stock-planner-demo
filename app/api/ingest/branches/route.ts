import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAuth, validatePayload } from '@/lib/ingest-helpers';

export const dynamic = 'force-dynamic';

interface BranchData {
    id: number;
    name: string;
    symbol: string;
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
                    where: { id: branch.id },
                    create: {
                        id: branch.id,
                        name: branch.name,
                        symbol: branch.symbol,
                    },
                    update: {
                        name: branch.name,
                        symbol: branch.symbol,
                    },
                });
                successCount++;
            } catch (err) {
                console.error(`[${syncRunId}] Failed to upsert branch ${branch.id}:`, err);
            }
        }

        console.log(`[${syncRunId}] Synced ${successCount}/${data.length} branches for client ${clientId}`);

        return NextResponse.json({ success: true, count: successCount });
    } catch (error) {
        console.error(`[${syncRunId}] Branches sync error:`, error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}
