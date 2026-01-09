import { NextRequest, NextResponse } from 'next/server';

export interface IngestPayload<T> {
    clientId: string;
    syncRunId: string;
    data: T[];
}

export function validateAuth(request: NextRequest): NextResponse | null {
    const authHeader = request.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json(
            { error: 'Unauthorized - Missing Bearer token' },
            { status: 401 }
        );
    }

    const apiKey = authHeader.substring(7);
    const expectedKey = process.env.API_KEY;

    if (!expectedKey) {
        console.error('API_KEY not configured in environment');
        return NextResponse.json(
            { error: 'Server configuration error' },
            { status: 500 }
        );
    }

    if (apiKey !== expectedKey) {
        return NextResponse.json(
            { error: 'Invalid API key' },
            { status: 403 }
        );
    }

    return null; // Auth passed
}

export async function validatePayload<T>(request: NextRequest): Promise<IngestPayload<T> | NextResponse> {
    try {
        const payload = await request.json();

        const { clientId, syncRunId, data } = payload;

        if (!clientId || typeof clientId !== 'string') {
            return NextResponse.json(
                { error: 'Missing or invalid clientId' },
                { status: 400 }
            );
        }

        if (!syncRunId || typeof syncRunId !== 'string') {
            return NextResponse.json(
                { error: 'Missing or invalid syncRunId' },
                { status: 400 }
            );
        }

        if (!Array.isArray(data)) {
            return NextResponse.json(
                { error: 'Invalid data - must be array' },
                { status: 400 }
            );
        }

        return { clientId, syncRunId, data } as IngestPayload<T>;
    } catch (error) {
        console.error('Payload parsing error:', error);
        return NextResponse.json(
            { error: 'Invalid JSON payload' },
            { status: 400 }
        );
    }
}
