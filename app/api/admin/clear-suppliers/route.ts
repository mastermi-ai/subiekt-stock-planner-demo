
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Delete all suppliers (products will set supplierId to null via SET NULL or cascade depending on schema, 
        // but safe to assume we want to wipe and re-sync)
        // Note: verify schema relations. If strict, might need to standardise/detach first.
        // Assuming schema allows this or we purge products too. 
        // Actually, just Wiping Suppliers is safer if we want to re-import correct ones.

        // Use transaction to be safe
        await prisma.$transaction([
            prisma.product.updateMany({
                data: { supplierId: null }
            }),
            prisma.supplier.deleteMany({})
        ]);

        return NextResponse.json({ success: true, message: 'All suppliers cleared' });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
