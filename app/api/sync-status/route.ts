import { NextResponse } from 'next/server';

/**
 * GET /api/sync-status
 * Returns information about the current synchronization status
 * 
 * This endpoint provides status information about the connector's sync activity.
 * The actual sync is performed by the external connector service.
 */
export async function GET() {
    try {
        // This is a placeholder endpoint since sync is handled by external connector
        // In production, this could query a status table or external API

        return NextResponse.json({
            status: 'active',
            message: 'Synchronization is handled by external connector service',
            connectorUrl: process.env.CONNECTOR_URL || 'Not configured',
            lastChecked: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error fetching sync status:', error);
        return NextResponse.json(
            { error: 'Failed to fetch sync status' },
            { status: 500 }
        );
    }
}
